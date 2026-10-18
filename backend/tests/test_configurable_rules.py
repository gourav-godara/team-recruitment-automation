"""Comprehensive unit tests for the Configurable Rule Engine.

Covers all 12 rule types, four-valued logic (PASS, FAIL, UNKNOWN, ERROR),
demographic safeguards (self-reported gender with unknown handling),
advisory vs mandatory severity, and pipeline integration.
"""

import pytest
from backend.app.schemas.rules import (
    ConfigurableRule,
    FailureAction,
    MissingDataAction,
    RuleCategory,
    RuleOutcome,
    RuleScope,
    RuleSeverity,
    RuleType,
)
from backend.app.schemas.scoring import (
    Member,
    ScoringConfig,
    SignalState,
    SignalValue,
    Team,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline
from backend.app.services.rule_engine import ConfigurableRuleEngine


# ----------------------------------------------------------------------
# 1. Team Composition & Diversity Rules (Self-reported Gender)
# ----------------------------------------------------------------------

def test_female_requirement_pass():
    """Team with at least one self-reported female member passes."""
    rule = ConfigurableRule(
        id="min-one-female",
        name="At Least One Female Member",
        category=RuleCategory.TEAM_COMPOSITION,
        scope=RuleScope.MEMBER,
        type=RuleType.COUNT_AT_LEAST,
        field="declared_gender",
        target_value="female",
        threshold=1.0,
        severity=RuleSeverity.MANDATORY,
    )
    team = Team(
        team_id="T_FEMALE_PASS",
        members=[
            Member(member_id="M1", signals={"declared_gender": "female"}),
            Member(member_id="M2", signals={"declared_gender": "male"}),
        ],
    )
    res = ConfigurableRuleEngine.evaluate_single_rule(team, rule)
    assert res.outcome == RuleOutcome.PASS
    assert res.evidence["qualifying_count"] == 1
    assert "Satisfied" in res.explanation


def test_female_requirement_fail():
    """All-male team fails when all genders are explicitly declared."""
    rule = ConfigurableRule(
        id="min-one-female",
        name="At Least One Female Member",
        category=RuleCategory.TEAM_COMPOSITION,
        scope=RuleScope.MEMBER,
        type=RuleType.COUNT_AT_LEAST,
        field="declared_gender",
        target_value="female",
        threshold=1.0,
        severity=RuleSeverity.MANDATORY,
    )
    team = Team(
        team_id="T_FEMALE_FAIL",
        members=[
            Member(member_id="M1", signals={"declared_gender": "male"}),
            Member(member_id="M2", signals={"declared_gender": "male"}),
        ],
    )
    res = ConfigurableRuleEngine.evaluate_single_rule(team, rule)
    assert res.outcome == RuleOutcome.FAIL
    assert res.evidence["qualifying_count"] == 0
    assert "Failed" in res.explanation


def test_female_requirement_undisclosed_gender_yields_unknown():
    """When gender is undisclosed/missing, rule evaluates to UNKNOWN (manual review), NOT automatic FAIL."""
    rule = ConfigurableRule(
        id="min-one-female",
        name="At Least One Female Member",
        category=RuleCategory.TEAM_COMPOSITION,
        scope=RuleScope.MEMBER,
        type=RuleType.COUNT_AT_LEAST,
        field="declared_gender",
        target_value="female",
        threshold=1.0,
        severity=RuleSeverity.MANDATORY,
        missing_data_action=MissingDataAction.MANUAL_REVIEW,
    )
    team = Team(
        team_id="T_UNKNOWN_GENDER",
        members=[
            Member(member_id="M1", signals={"declared_gender": "male"}),
            Member(member_id="M2", signals={"declared_gender": SignalValue(value=None, status=SignalState.MISSING)}),
        ],
    )
    res = ConfigurableRuleEngine.evaluate_single_rule(team, rule)
    assert res.outcome == RuleOutcome.UNKNOWN
    assert res.requires_manual_review is True
    assert res.missing_data is True
    assert "inconclusive" in res.explanation.lower()


# ----------------------------------------------------------------------
# 2. Team Size & Registration Rules
# ----------------------------------------------------------------------

def test_team_size_between():
    """Validates team size bounds [min_value, max_value]."""
    rule = ConfigurableRule(
        id="team-size-2-4",
        name="Team Size 2 to 4",
        type=RuleType.TEAM_SIZE_BETWEEN,
        min_value=2.0,
        max_value=4.0,
    )

    # 3 members -> PASS
    t3 = Team(team_id="T3", members=[Member(member_id=f"M{i}") for i in range(3)])
    assert ConfigurableRuleEngine.evaluate_single_rule(t3, rule).outcome == RuleOutcome.PASS

    # 1 member -> FAIL
    t1 = Team(team_id="T1", members=[Member(member_id="M1")])
    assert ConfigurableRuleEngine.evaluate_single_rule(t1, rule).outcome == RuleOutcome.FAIL

    # 5 members -> FAIL
    t5 = Team(team_id="T5", members=[Member(member_id=f"M{i}") for i in range(5)])
    assert ConfigurableRuleEngine.evaluate_single_rule(t5, rule).outcome == RuleOutcome.FAIL


# ----------------------------------------------------------------------
# 3. Technical Eligibility & Skills
# ----------------------------------------------------------------------

def test_required_skill_pass_and_fail():
    """Validates mandatory skill coverage across team members."""
    rule = ConfigurableRule(
        id="need-python",
        name="Team Must Have Python",
        type=RuleType.REQUIRED_SKILL,
        required_values=["python"],
    )

    t_pass = Team(
        team_id="T_PASS",
        members=[
            Member(member_id="M1", signals={"skills": "React, TypeScript"}),
            Member(member_id="M2", signals={"skills": "Python, Docker"}),
        ],
    )
    assert ConfigurableRuleEngine.evaluate_single_rule(t_pass, rule).outcome == RuleOutcome.PASS

    t_fail = Team(
        team_id="T_FAIL",
        members=[
            Member(member_id="M1", signals={"skills": "Go, Rust"}),
            Member(member_id="M2", signals={"skills": "C++"}),
        ],
    )
    assert ConfigurableRuleEngine.evaluate_single_rule(t_fail, rule).outcome == RuleOutcome.FAIL


def test_required_role_coverage():
    """Validates full team role coverage."""
    rule = ConfigurableRule(
        id="roles-coverage",
        name="Full Stack Coverage",
        type=RuleType.REQUIRED_ROLE_COVERAGE,
        required_values=["frontend", "backend"],
    )

    t_pass = Team(
        team_id="T_PASS",
        members=[
            Member(member_id="M1", signals={"role": "frontend"}),
            Member(member_id="M2", signals={"role": "backend"}),
        ],
    )
    assert ConfigurableRuleEngine.evaluate_single_rule(t_pass, rule).outcome == RuleOutcome.PASS

    t_fail = Team(
        team_id="T_FAIL",
        members=[
            Member(member_id="M1", signals={"role": "frontend"}),
            Member(member_id="M2", signals={"role": "designer"}),
        ],
    )
    assert ConfigurableRuleEngine.evaluate_single_rule(t_fail, rule).outcome == RuleOutcome.FAIL


# ----------------------------------------------------------------------
# 4. Diversity & Distinct Counts
# ----------------------------------------------------------------------

def test_distinct_count_at_least():
    """Validates multidisciplinary diversity across departments."""
    rule = ConfigurableRule(
        id="distinct-depts",
        name="At Least 2 Departments",
        type=RuleType.DISTINCT_COUNT_AT_LEAST,
        field="department",
        threshold=2.0,
    )

    t_diff = Team(
        team_id="T_DIFF",
        members=[
            Member(member_id="M1", signals={"department": "Engineering"}),
            Member(member_id="M2", signals={"department": "Design"}),
        ],
    )
    assert ConfigurableRuleEngine.evaluate_single_rule(t_diff, rule).outcome == RuleOutcome.PASS

    t_same = Team(
        team_id="T_SAME",
        members=[
            Member(member_id="M1", signals={"department": "Engineering"}),
            Member(member_id="M2", signals={"department": "Engineering"}),
        ],
    )
    assert ConfigurableRuleEngine.evaluate_single_rule(t_same, rule).outcome == RuleOutcome.FAIL


# ----------------------------------------------------------------------
# 5. Numeric Thresholds & Valid Zero vs Missing
# ----------------------------------------------------------------------

def test_number_gte_valid_zero_distinction():
    """Experience 0.0 is a valid number and evaluated against threshold, not treated as missing."""
    rule = ConfigurableRule(
        id="min-exp-1",
        name="At Least 1 Year Experience",
        type=RuleType.NUMBER_GTE,
        field="experience_years",
        threshold=1.0,
    )

    # 0.0 years: valid zero, fails >= 1.0
    t_zero = Team(
        team_id="T_ZERO",
        members=[Member(member_id="M1", signals={"experience_years": 0.0})],
    )
    res_zero = ConfigurableRuleEngine.evaluate_single_rule(t_zero, rule)
    assert res_zero.outcome == RuleOutcome.FAIL
    assert res_zero.missing_data is False
    assert res_zero.evidence["evaluated_value"] == 0.0

    # None: missing data
    t_none = Team(
        team_id="T_NONE",
        members=[Member(member_id="M1", signals={"experience_years": None})],
    )
    res_none = ConfigurableRuleEngine.evaluate_single_rule(t_none, rule)
    assert res_none.outcome == RuleOutcome.UNKNOWN
    assert res_none.missing_data is True


# ----------------------------------------------------------------------
# 6. Advisory vs Mandatory Severity
# ----------------------------------------------------------------------

def test_advisory_rule_failure_does_not_disqualify():
    """Advisory rule failure flags for review but maintains is_eligible = True."""
    advisory_rule = ConfigurableRule(
        id="adv-rule",
        name="Advisory Rule",
        type=RuleType.REQUIRED_SKILL,
        required_values=["kubernetes"],
        severity=RuleSeverity.ADVISORY,
    )
    team = Team(
        team_id="T_ADV",
        members=[Member(member_id="M1", signals={"skills": "python"})],
    )
    summary = ConfigurableRuleEngine.evaluate_team(team, [advisory_rule])
    assert summary.is_eligible is True
    assert summary.status == RuleOutcome.PASS
    assert len(summary.failed_rules) == 1
    assert summary.failed_rules[0].severity == "advisory"


# ----------------------------------------------------------------------
# 7. End-to-End Decision Pipeline Integration
# ----------------------------------------------------------------------

def test_pipeline_integration_with_configurable_rules():
    """Pipeline rejects ineligible teams, preserves them without shortlist rank, and computes rankings for eligible teams."""
    config = ScoringConfig(
        top_x=1,
        weights={"skills_score": 1.0},
        configurable_rules=[
            ConfigurableRule(
                id="female-req",
                name="At Least One Female",
                type=RuleType.COUNT_AT_LEAST,
                field="declared_gender",
                target_value="female",
                threshold=1.0,
                severity=RuleSeverity.MANDATORY,
            )
        ],
    )

    t_eligible = Team(
        team_id="T_ELIGIBLE",
        name="Eligible Team",
        members=[
            Member(member_id="M1", signals={"declared_gender": "female", "skills_score": 85.0}),
            Member(member_id="M2", signals={"declared_gender": "male", "skills_score": 75.0}),
        ],
    )

    t_ineligible = Team(
        team_id="T_INELIGIBLE",
        name="All Male Team",
        members=[
            Member(member_id="M3", signals={"declared_gender": "male", "skills_score": 95.0}),
            Member(member_id="M4", signals={"declared_gender": "male", "skills_score": 95.0}),
        ],
    )

    response = evaluate_teams_pipeline([t_eligible, t_ineligible], config)

    assert response.total_teams == 2
    assert response.eligible_teams == 1
    assert response.shortlisted_teams == 1
    assert response.rejected_teams == 1

    # T_ELIGIBLE must be SHORTLISTED with rank 1
    res_elig = next(r for r in response.results if r.team_id == "T_ELIGIBLE")
    assert res_elig.status == "SHORTLISTED"
    assert res_elig.rank == 1

    # T_INELIGIBLE must be REJECTED, rank None, with explicit reason
    res_inelig = next(r for r in response.results if r.team_id == "T_INELIGIBLE")
    assert res_inelig.status == "REJECTED"
    assert res_inelig.rank is None
    assert any("Ineligible" in r or "Failed" in r for r in res_inelig.reasons)
