"""Declarative, reusable Configurable Rule Engine for recruitment and hackathon eligibility.

Evaluates team composition, technical eligibility, registration validation, and data quality
safeguards using deterministic four-valued logic (PASS, FAIL, UNKNOWN, ERROR).
"""

from typing import Any, Dict, List, Optional, Set, Tuple
from backend.app.schemas.rules import (
    ConfigurableRule,
    FailureAction,
    MissingDataAction,
    RuleCategory,
    RuleEvaluationDetail,
    RuleOutcome,
    RuleScope,
    RuleSeverity,
    RuleType,
    TeamEligibilitySummary,
)
from backend.app.schemas.scoring import SignalState, SignalValue, Team


def _normalize_skill(skill: str) -> str:
    """Canonicalize a skill string for comparison (lowercase, trimmed, strip hyphens/spaces)."""
    return skill.strip().lower().replace("-", " ")


class ConfigurableRuleEngine:
    """Evaluates declarative eligibility rules against candidate teams."""

    @classmethod
    def evaluate_team(
        cls,
        team: Team,
        rules: List[ConfigurableRule],
    ) -> TeamEligibilitySummary:
        """Evaluates all enabled configurable rules on a team and computes consolidated eligibility."""
        active_rules = [r for r in rules if r.enabled]
        if not active_rules:
            return TeamEligibilitySummary(
                status=RuleOutcome.PASS,
                is_eligible=True,
                requires_manual_review=False,
                summary="No active eligibility rules configured; default PASS.",
            )

        passed_rules: List[RuleEvaluationDetail] = []
        failed_rules: List[RuleEvaluationDetail] = []
        unknown_rules: List[RuleEvaluationDetail] = []
        error_rules: List[RuleEvaluationDetail] = []

        for rule in active_rules:
            detail = cls.evaluate_single_rule(team, rule)
            if detail.outcome == RuleOutcome.PASS:
                passed_rules.append(detail)
            elif detail.outcome == RuleOutcome.FAIL:
                failed_rules.append(detail)
            elif detail.outcome == RuleOutcome.UNKNOWN:
                unknown_rules.append(detail)
            elif detail.outcome == RuleOutcome.ERROR:
                error_rules.append(detail)

        # Mandatory rule failures take precedence
        mandatory_fails = [r for r in failed_rules if r.severity == RuleSeverity.MANDATORY.value]
        mandatory_unknowns = [r for r in unknown_rules if r.severity == RuleSeverity.MANDATORY.value]
        mandatory_errors = [r for r in error_rules if r.severity == RuleSeverity.MANDATORY.value]

        requires_review = bool(unknown_rules or any(r.requires_manual_review for r in failed_rules))

        if mandatory_errors:
            status = RuleOutcome.ERROR
            is_eligible = False
            summary = f"Evaluation encountered {len(mandatory_errors)} configuration error(s)."
        elif mandatory_fails:
            status = RuleOutcome.FAIL
            is_eligible = False
            fail_reasons = "; ".join(r.explanation for r in mandatory_fails)
            summary = f"Failed {len(mandatory_fails)} mandatory eligibility rule(s): {fail_reasons}"
        elif mandatory_unknowns:
            status = RuleOutcome.UNKNOWN
            is_eligible = False
            summary = (
                f"{len(mandatory_unknowns)} mandatory requirement(s) cannot be verified due to "
                "missing or undisclosed information. Requires manual recruiter review."
            )
        else:
            status = RuleOutcome.PASS
            is_eligible = True
            if failed_rules:
                summary = f"Passed all mandatory rules. {len(failed_rules)} advisory warning(s) flagged."
            elif unknown_rules:
                summary = f"Passed all mandatory rules. {len(unknown_rules)} advisory item(s) pending review."
            else:
                summary = f"Successfully satisfied all {len(passed_rules)} eligibility requirement(s)."

        return TeamEligibilitySummary(
            status=status,
            is_eligible=is_eligible,
            requires_manual_review=requires_review,
            passed_rules=passed_rules,
            failed_rules=failed_rules,
            unknown_rules=unknown_rules,
            error_rules=error_rules,
            summary=summary,
        )

    @classmethod
    def evaluate_single_rule(
        cls,
        team: Team,
        rule: ConfigurableRule,
    ) -> RuleEvaluationDetail:
        """Evaluates an individual declarative rule against a team."""
        try:
            handler = getattr(cls, f"_eval_{rule.type.value.lower()}", None)
            if not handler:
                return RuleEvaluationDetail(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    category=rule.category.value,
                    outcome=RuleOutcome.ERROR,
                    severity=rule.severity.value,
                    explanation=f"Unsupported rule type '{rule.type.value}'.",
                )
            return handler(team, rule)
        except Exception as e:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.ERROR,
                severity=rule.severity.value,
                explanation=f"Internal evaluation error: {str(e)}",
            )

    # -------------------------------------------------------------------------
    # Rule Type Implementations
    # -------------------------------------------------------------------------

    @classmethod
    def _eval_count_at_least(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        threshold = int(rule.threshold or 1)
        target_val = str(rule.target_value).strip().lower() if rule.target_value is not None else None

        qualifying_members: List[str] = []
        unknown_members: List[str] = []
        non_qualifying_members: List[str] = []

        for m in team.members:
            m_name = m.name or m.member_id
            sig = m.signals.get(rule.field or "")
            if sig is None or sig.status == SignalState.MISSING or sig.value is None:
                unknown_members.append(m_name)
            elif sig.status == SignalState.INVALID:
                unknown_members.append(m_name)
            else:
                actual_val = str(sig.value).strip().lower()
                if target_val is None or actual_val == target_val:
                    qualifying_members.append(m_name)
                else:
                    non_qualifying_members.append(m_name)

        q_count = len(qualifying_members)
        u_count = len(unknown_members)

        evidence = {
            "qualifying_count": q_count,
            "unknown_count": u_count,
            "non_qualifying_count": len(non_qualifying_members),
            "qualifying_members": qualifying_members,
            "unknown_members": unknown_members,
            "threshold": threshold,
            "target_value": rule.target_value,
        }

        if q_count >= threshold:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=(
                    f"Satisfied requirement: Found {q_count} qualifying member(s) "
                    f"({', '.join(qualifying_members)}) with '{rule.field}={rule.target_value}' (threshold >= {threshold})."
                ),
                evidence=evidence,
            )

        # Threshold not yet reached by confirmed members
        if q_count + u_count >= threshold:
            # Missing members could potentially bridge the gap
            outcome = (
                RuleOutcome.FAIL
                if rule.missing_data_action == MissingDataAction.FAIL
                else RuleOutcome.UNKNOWN
            )
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=outcome,
                severity=rule.severity.value,
                explanation=(
                    f"Inconclusive: Only {q_count} confirmed qualifying member(s), but {u_count} member(s) "
                    f"({', '.join(unknown_members)}) have missing/undisclosed '{rule.field}'. "
                    f"Cannot conclusively verify requirement >= {threshold}."
                ),
                evidence=evidence,
                missing_data=True,
                requires_manual_review=(rule.missing_data_action == MissingDataAction.MANUAL_REVIEW),
            )

        # Even if all unknowns were qualifying, threshold cannot be met
        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=(
                f"Failed requirement: Only {q_count} qualifying member(s) found "
                f"(minimum required is {threshold})."
            ),
            evidence=evidence,
            missing_data=(u_count > 0),
        )

    @classmethod
    def _eval_count_at_most(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        threshold = int(rule.threshold or 0)
        target_val = str(rule.target_value).strip().lower() if rule.target_value is not None else None

        qualifying_members: List[str] = []
        for m in team.members:
            sig = m.signals.get(rule.field or "")
            if sig and sig.status == SignalState.PRESENT and sig.value is not None:
                actual_val = str(sig.value).strip().lower()
                if target_val is None or actual_val == target_val:
                    qualifying_members.append(m.name or m.member_id)

        count = len(qualifying_members)
        evidence = {"count": count, "threshold": threshold, "members": qualifying_members}

        if count <= threshold:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Satisfied: {count} member(s) with '{rule.field}={rule.target_value}' (limit <= {threshold}).",
                evidence=evidence,
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Exceeded limit: {count} member(s) match '{rule.field}={rule.target_value}' (maximum allowed is {threshold}).",
            evidence=evidence,
        )

    @classmethod
    def _eval_team_size_between(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        min_sz = int(rule.min_value or 1)
        max_sz = int(rule.max_value or 100)
        actual_size = len(team.members)

        evidence = {"actual_size": actual_size, "min_required": min_sz, "max_allowed": max_sz}

        if min_sz <= actual_size <= max_sz:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Team size of {actual_size} is within permitted range [{min_sz}, {max_sz}].",
                evidence=evidence,
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=(
                f"Team size {actual_size} is outside permitted range [{min_sz}, {max_sz}]. "
                f"{'Team is too small' if actual_size < min_sz else 'Team is too large'}."
            ),
            evidence=evidence,
        )

    @classmethod
    def _eval_required_skill(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        req_skills: Set[str] = set()
        if rule.required_values:
            req_skills.update(_normalize_skill(s) for s in rule.required_values)
        if rule.target_value:
            req_skills.add(_normalize_skill(str(rule.target_value)))

        found_skills: Dict[str, List[str]] = {}
        unknown_skill_members: List[str] = []

        for m in team.members:
            m_name = m.name or m.member_id
            sig = m.signals.get("skills")
            if sig is None or sig.status in (SignalState.MISSING, SignalState.INVALID) or sig.value is None:
                unknown_skill_members.append(m_name)
            else:
                if isinstance(sig.value, list):
                    raw_skills = sig.value
                elif isinstance(sig.value, str):
                    raw_skills = [s.strip() for s in sig.value.split(",") if s.strip()]
                else:
                    raw_skills = [str(sig.value)]
                norm_m_skills = {_normalize_skill(s) for s in raw_skills if s}
                for req in req_skills:
                    if req in norm_m_skills:
                        found_skills.setdefault(req, []).append(m_name)

        evidence = {
            "required_skills": list(req_skills),
            "found_skills": found_skills,
            "unknown_skill_members": unknown_skill_members,
        }

        if len(found_skills) == len(req_skills):
            matched_summary = ", ".join(f"{k}: {', '.join(v)}" for k, v in found_skills.items())
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Required skill coverage satisfied ({matched_summary}).",
                evidence=evidence,
            )

        missing_skills = [s for s in req_skills if s not in found_skills]
        if unknown_skill_members:
            outcome = (
                RuleOutcome.FAIL
                if rule.missing_data_action == MissingDataAction.FAIL
                else RuleOutcome.UNKNOWN
            )
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=outcome,
                severity=rule.severity.value,
                explanation=(
                    f"Missing required skill(s): {', '.join(missing_skills)}. "
                    f"{len(unknown_skill_members)} member(s) have undisclosed skill data."
                ),
                evidence=evidence,
                missing_data=True,
                requires_manual_review=(rule.missing_data_action == MissingDataAction.MANUAL_REVIEW),
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Team lacks required skill(s): {', '.join(missing_skills)}.",
            evidence=evidence,
        )

    @classmethod
    def _eval_required_role_coverage(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        req_roles = {_normalize_skill(r) for r in rule.required_values}
        found_roles: Dict[str, List[str]] = {}
        unknown_role_members: List[str] = []

        for m in team.members:
            m_name = m.name or m.member_id
            sig = m.signals.get("role")
            if sig is None or sig.status in (SignalState.MISSING, SignalState.INVALID) or sig.value is None:
                unknown_role_members.append(m_name)
            else:
                role_val = _normalize_skill(str(sig.value))
                if role_val in req_roles:
                    found_roles.setdefault(role_val, []).append(m_name)

        evidence = {
            "required_roles": list(req_roles),
            "found_roles": found_roles,
            "unknown_role_members": unknown_role_members,
        }

        if len(found_roles) == len(req_roles):
            role_summary = ", ".join(f"{k} ({', '.join(v)})" for k, v in found_roles.items())
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Required role coverage satisfied: {role_summary}.",
                evidence=evidence,
            )

        missing_roles = [r for r in req_roles if r not in found_roles]
        if unknown_role_members:
            outcome = (
                RuleOutcome.FAIL
                if rule.missing_data_action == MissingDataAction.FAIL
                else RuleOutcome.UNKNOWN
            )
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=outcome,
                severity=rule.severity.value,
                explanation=(
                    f"Team missing role(s): {', '.join(missing_roles)}. "
                    f"{len(unknown_role_members)} member(s) have unassigned roles."
                ),
                evidence=evidence,
                missing_data=True,
                requires_manual_review=(rule.missing_data_action == MissingDataAction.MANUAL_REVIEW),
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Team fails role coverage. Missing required role(s): {', '.join(missing_roles)}.",
            evidence=evidence,
        )

    @classmethod
    def _eval_distinct_count_at_least(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        threshold = int(rule.threshold or 1)
        target_field = rule.field or "department"

        distinct_values: Dict[str, List[str]] = {}
        unknown_members: List[str] = []

        for m in team.members:
            m_name = m.name or m.member_id
            sig = m.signals.get(target_field)
            if sig is None or sig.status in (SignalState.MISSING, SignalState.INVALID) or sig.value is None:
                unknown_members.append(m_name)
            else:
                val = str(sig.value).strip().lower()
                distinct_values.setdefault(val, []).append(m_name)

        distinct_count = len(distinct_values)
        evidence = {
            "distinct_count": distinct_count,
            "threshold": threshold,
            "distinct_values": list(distinct_values.keys()),
            "unknown_members": unknown_members,
        }

        if distinct_count >= threshold:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Satisfied diversity: {distinct_count} distinct '{target_field}' value(s) found (threshold >= {threshold}).",
                evidence=evidence,
            )

        if distinct_count + len(unknown_members) >= threshold:
            outcome = (
                RuleOutcome.FAIL
                if rule.missing_data_action == MissingDataAction.FAIL
                else RuleOutcome.UNKNOWN
            )
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=outcome,
                severity=rule.severity.value,
                explanation=(
                    f"Only {distinct_count} confirmed distinct '{target_field}' values, but {len(unknown_members)} "
                    f"member(s) have undisclosed data. Cannot conclusively verify requirement >= {threshold}."
                ),
                evidence=evidence,
                missing_data=True,
                requires_manual_review=(rule.missing_data_action == MissingDataAction.MANUAL_REVIEW),
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Insufficient diversity: only {distinct_count} distinct '{target_field}' found (minimum required is {threshold}).",
            evidence=evidence,
        )

    @classmethod
    def _eval_data_completeness_at_least(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        threshold = float(rule.threshold or 0.7)
        total_fields = 0
        present_fields = 0

        for m in team.members:
            for k, sig in m.signals.items():
                if k in ("declared_gender", "gender"):  # exclude optional demographic fields from completeness check
                    continue
                total_fields += 1
                if sig.status == SignalState.PRESENT and sig.value is not None:
                    present_fields += 1

        completeness = (present_fields / total_fields) if total_fields > 0 else 0.0
        pct = round(completeness * 100, 1)
        req_pct = round(threshold * 100, 1)

        evidence = {"completeness_ratio": completeness, "present_fields": present_fields, "total_fields": total_fields}

        if completeness >= threshold:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Data completeness is {pct}% (satisfies threshold >= {req_pct}%).",
                evidence=evidence,
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Data completeness is {pct}% (fails minimum threshold of {req_pct}%).",
            evidence=evidence,
        )

    @classmethod
    def _eval_number_gte(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        threshold = float(rule.threshold or 0.0)
        field_name = rule.field or ""

        # Check team signal first, then aggregate average across members
        sig = team.team_signals.get(field_name)
        if sig and sig.status == SignalState.PRESENT and sig.value is not None:
            actual = float(sig.value)
        else:
            member_vals = []
            for m in team.members:
                m_sig = m.signals.get(field_name)
                if m_sig and m_sig.status == SignalState.PRESENT and m_sig.value is not None:
                    try:
                        member_vals.append(float(m_sig.value))
                    except (ValueError, TypeError):
                        pass
            if not member_vals:
                return RuleEvaluationDetail(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    category=rule.category.value,
                    outcome=RuleOutcome.UNKNOWN,
                    severity=rule.severity.value,
                    explanation=f"No valid numeric data found for field '{field_name}'.",
                    missing_data=True,
                )
            actual = sum(member_vals) / len(member_vals)

        evidence = {"actual_value": actual, "evaluated_value": actual, "threshold": threshold}
        if actual >= threshold:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Field '{field_name}' value {actual} satisfies requirement >= {threshold}.",
                evidence=evidence,
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Field '{field_name}' value {actual} is below required threshold of {threshold}.",
            evidence=evidence,
        )

    @classmethod
    def _eval_number_lte(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        threshold = float(rule.threshold or 0.0)
        field_name = rule.field or ""

        sig = team.team_signals.get(field_name)
        if sig and sig.status == SignalState.PRESENT and sig.value is not None:
            actual = float(sig.value)
        else:
            member_vals = [
                float(m.signals[field_name].value)
                for m in team.members
                if field_name in m.signals and m.signals[field_name].value is not None
            ]
            if not member_vals:
                return RuleEvaluationDetail(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    category=rule.category.value,
                    outcome=RuleOutcome.UNKNOWN,
                    severity=rule.severity.value,
                    explanation=f"No valid numeric data found for field '{field_name}'.",
                    missing_data=True,
                )
            actual = sum(member_vals) / len(member_vals)

        evidence = {"actual_value": actual, "evaluated_value": actual, "threshold": threshold}
        if actual <= threshold:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Field '{field_name}' value {actual} satisfies limit <= {threshold}.",
                evidence=evidence,
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Field '{field_name}' value {actual} exceeds maximum allowed of {threshold}.",
            evidence=evidence,
        )

    @classmethod
    def _eval_field_equals(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        field_name = rule.field or ""
        expected = str(rule.target_value).strip().lower()

        # Member scope vs Team scope
        if rule.scope == RuleScope.MEMBER:
            m_matches = []
            for m in team.members:
                sig = m.signals.get(field_name)
                if sig and sig.value is not None and str(sig.value).strip().lower() == expected:
                    m_matches.append(m.name or m.member_id)
            if m_matches:
                return RuleEvaluationDetail(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    category=rule.category.value,
                    outcome=RuleOutcome.PASS,
                    severity=rule.severity.value,
                    explanation=f"Member(s) ({', '.join(m_matches)}) match '{field_name}={rule.target_value}'.",
                )
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.FAIL,
                severity=rule.severity.value,
                explanation=f"No member matches expected '{field_name}={rule.target_value}'.",
            )

        sig = team.team_signals.get(field_name)
        if not sig or sig.value is None:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.UNKNOWN,
                severity=rule.severity.value,
                explanation=f"Team field '{field_name}' is missing.",
                missing_data=True,
            )

        actual = str(sig.value).strip().lower()
        if actual == expected:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"Team field '{field_name}' matches expected '{rule.target_value}'.",
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Team field '{field_name}' is '{sig.value}', expected '{rule.target_value}'.",
        )

    @classmethod
    def _eval_field_exists(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        field_name = rule.field or ""
        missing_members = []
        present_members = []

        for m in team.members:
            sig = m.signals.get(field_name)
            if sig is None or sig.status in (SignalState.MISSING, SignalState.INVALID) or sig.value is None:
                missing_members.append(m.name or m.member_id)
            else:
                present_members.append(m.name or m.member_id)

        if not missing_members:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"All {len(present_members)} member(s) have required field '{field_name}'.",
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Missing required field '{field_name}' for member(s): {', '.join(missing_members)}.",
            missing_data=True,
        )

    @classmethod
    def _eval_field_in(cls, team: Team, rule: ConfigurableRule) -> RuleEvaluationDetail:
        allowed = {str(x).strip().lower() for x in (rule.required_values or [])}
        field_name = rule.field or ""

        non_compliant = []
        for m in team.members:
            sig = m.signals.get(field_name)
            if not sig or sig.value is None or str(sig.value).strip().lower() not in allowed:
                non_compliant.append(m.name or m.member_id)

        if not non_compliant:
            return RuleEvaluationDetail(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category.value,
                outcome=RuleOutcome.PASS,
                severity=rule.severity.value,
                explanation=f"All members satisfy allowed values for '{field_name}'.",
            )

        return RuleEvaluationDetail(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category.value,
            outcome=RuleOutcome.FAIL,
            severity=rule.severity.value,
            explanation=f"Member(s) ({', '.join(non_compliant)}) have '{field_name}' values outside allowed set.",
        )
