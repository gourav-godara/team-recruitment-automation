import pytest
from backend.app.schemas.scoring import (
    EligibilityResult,
    Member,
    MissingDataPolicy,
    RuleConfig,
    RuleOperator,
    RuleScope,
    RuleStatus,
    SignalState,
    SignalValue,
    Team,
)
from backend.app.services.eligibility_engine import evaluate_eligibility, evaluate_single_rule


def test_rule_operators():
    """Tests various rule comparison operators."""
    team = Team(
        team_id="T1",
        members=[
            Member(
                member_id="M1",
                signals={
                    "age": 21,
                    "role": "lead",
                    "skills": "python,fastapi",
                    "repo": "https://github.com/myrepo",
                },
            )
        ],
    )

    # GTE
    r_gte = RuleConfig(name="Age check", field="age", operator=RuleOperator.GTE, value=18)
    assert evaluate_single_rule(team, r_gte).status == RuleStatus.PASS

    # LT (should fail)
    r_lt = RuleConfig(name="Age max", field="age", operator=RuleOperator.LT, value=20)
    assert evaluate_single_rule(team, r_lt).status == RuleStatus.FAIL

    # EQ
    r_eq = RuleConfig(name="Role check", field="role", operator=RuleOperator.EQ, value="lead")
    assert evaluate_single_rule(team, r_eq).status == RuleStatus.PASS

    # NEQ
    r_neq = RuleConfig(name="Not guest", field="role", operator=RuleOperator.NEQ, value="guest")
    assert evaluate_single_rule(team, r_neq).status == RuleStatus.PASS

    # IN
    r_in = RuleConfig(name="Skill check", field="role", operator=RuleOperator.IN, value=["lead", "admin"])
    assert evaluate_single_rule(team, r_in).status == RuleStatus.PASS

    # NOT_IN
    r_notin = RuleConfig(name="Role blocked", field="role", operator=RuleOperator.NOT_IN, value=["banned"])
    assert evaluate_single_rule(team, r_notin).status == RuleStatus.PASS

    # EXISTS
    r_exists = RuleConfig(name="Repo exists", field="repo", operator=RuleOperator.EXISTS)
    assert evaluate_single_rule(team, r_exists).status == RuleStatus.PASS

    # NOT_EXISTS (should fail because repo exists)
    r_not_exists = RuleConfig(name="No portfolio", field="portfolio", operator=RuleOperator.NOT_EXISTS)
    assert evaluate_single_rule(team, r_not_exists).status == RuleStatus.PASS


def test_member_any_rule_evaluation():
    """At least one member must have github >= 50."""
    rule = RuleConfig(
        name="GitHub minimum",
        scope=RuleScope.MEMBER,
        field="github_contributions",
        operator=RuleOperator.GTE,
        value=50,
        aggregation="ANY",
    )

    # Passing team
    team_pass = Team(
        team_id="T_PASS",
        members=[
            Member(member_id="M1", signals={"github_contributions": 72}),
            Member(member_id="M2", signals={"github_contributions": 10}),
        ],
    )
    res_pass = evaluate_single_rule(team_pass, rule)
    assert res_pass.status == RuleStatus.PASS

    # Failing team (all valid, none reach 50)
    team_fail = Team(
        team_id="T_FAIL",
        members=[
            Member(member_id="M1", signals={"github_contributions": 30}),
            Member(member_id="M2", signals={"github_contributions": 20}),
        ],
    )
    res_fail = evaluate_single_rule(team_fail, rule)
    assert res_fail.status == RuleStatus.FAIL

    # Insufficient data team (one below 50, one missing)
    team_insufficient = Team(
        team_id="T_INSUF",
        members=[
            Member(member_id="M1", signals={"github_contributions": 30}),
            Member(member_id="M2", signals={"github_contributions": None}),
        ],
    )
    res_insuf = evaluate_single_rule(team_insufficient, rule)
    assert res_insuf.status == RuleStatus.INSUFFICIENT_DATA


def test_member_all_rule_evaluation():
    """All members must have project count >= 2."""
    rule = RuleConfig(
        name="All project experience",
        scope=RuleScope.MEMBER,
        field="projects",
        operator=RuleOperator.GTE,
        value=2,
        aggregation="ALL",
    )

    team_all_pass = Team(
        team_id="T1",
        members=[
            Member(member_id="M1", signals={"projects": 4}),
            Member(member_id="M2", signals={"projects": 2}),
        ],
    )
    assert evaluate_single_rule(team_all_pass, rule).status == RuleStatus.PASS

    team_one_fail = Team(
        team_id="T2",
        members=[
            Member(member_id="M1", signals={"projects": 4}),
            Member(member_id="M2", signals={"projects": 1}),
        ],
    )
    assert evaluate_single_rule(team_one_fail, rule).status == RuleStatus.FAIL

    team_one_missing = Team(
        team_id="T3",
        members=[
            Member(member_id="M1", signals={"projects": 4}),
            Member(member_id="M2", signals={"projects": None}),
        ],
    )
    assert evaluate_single_rule(team_one_missing, rule).status == RuleStatus.INSUFFICIENT_DATA


def test_team_scoped_rule():
    """Rules evaluating team-level signals directly."""
    rule = RuleConfig(
        name="Team NDA Signed",
        scope=RuleScope.TEAM,
        field="nda_signed",
        operator=RuleOperator.EQ,
        value=True,
    )

    team_yes = Team(team_id="T1", team_signals={"nda_signed": True})
    assert evaluate_single_rule(team_yes, rule).status == RuleStatus.PASS

    team_no = Team(team_id="T2", team_signals={"nda_signed": False})
    assert evaluate_single_rule(team_no, rule).status == RuleStatus.FAIL

    team_missing = Team(team_id="T3", team_signals={})
    assert evaluate_single_rule(team_missing, rule).status == RuleStatus.INSUFFICIENT_DATA


def test_missing_data_policy_require_in_rules():
    """When policy is REQUIRE, missing data immediately results in FAIL."""
    rule = RuleConfig(
        name="Strict GitHub requirement",
        scope=RuleScope.MEMBER,
        field="github_contributions",
        operator=RuleOperator.GTE,
        value=50,
        aggregation="ANY",
        missing_policy=MissingDataPolicy.REQUIRE,
    )

    team = Team(
        team_id="T1",
        members=[
            Member(member_id="M1", signals={"github_contributions": 30}),
            Member(member_id="M2", signals={"github_contributions": None}),
        ],
    )
    res = evaluate_single_rule(team, rule)
    assert res.status == RuleStatus.FAIL
    assert "missing" in res.reason.lower()


def test_overall_eligibility_aggregation():
    """Tests overall eligibility decision with multiple rules."""
    rules = [
        RuleConfig(
            name="Rule 1",
            scope=RuleScope.MEMBER,
            field="projects",
            operator=RuleOperator.GTE,
            value=1,
            aggregation="ANY",
        ),
        RuleConfig(
            name="Rule 2",
            scope=RuleScope.MEMBER,
            field="github_contributions",
            operator=RuleOperator.GTE,
            value=50,
            aggregation="ANY",
        ),
    ]

    # Team that passes both
    team_pass = Team(
        team_id="T1",
        members=[
            Member(member_id="M1", signals={"projects": 2, "github_contributions": 60}),
        ],
    )
    res_pass = evaluate_eligibility(team_pass, rules)
    assert res_pass.status == RuleStatus.PASS
    assert len(res_pass.passed_rules) == 2

    # Team that fails one
    team_fail = Team(
        team_id="T2",
        members=[
            Member(member_id="M1", signals={"projects": 2, "github_contributions": 10}),
        ],
    )
    res_fail = evaluate_eligibility(team_fail, rules)
    assert res_fail.status == RuleStatus.FAIL
    assert len(res_fail.failed_rules) == 1

    # Team with insufficient data
    team_insuf = Team(
        team_id="T3",
        members=[
            Member(member_id="M1", signals={"projects": 2, "github_contributions": None}),
        ],
    )
    res_insuf = evaluate_eligibility(team_insuf, rules)
    assert res_insuf.status == RuleStatus.INSUFFICIENT_DATA
    assert len(res_insuf.insufficient_rules) == 1


def test_percentage_rule_requires_threshold():
    """PERCENTAGE aggregation rule must explicitly specify a valid threshold."""
    with pytest.raises(ValueError, match="must explicitly specify a 'threshold'"):
        RuleConfig(
            name="No threshold percentage",
            scope=RuleScope.MEMBER,
            field="projects",
            operator=RuleOperator.GTE,
            value=2,
            aggregation="PERCENTAGE",
        )

    # Valid percentage rule
    valid_rule = RuleConfig(
        name="Valid percentage",
        scope=RuleScope.MEMBER,
        field="projects",
        operator=RuleOperator.GTE,
        value=2,
        aggregation="PERCENTAGE",
        threshold=0.5,
    )
    team = Team(
        team_id="T1",
        members=[
            Member(member_id="M1", signals={"projects": 3}),
            Member(member_id="M2", signals={"projects": 1}),
        ],
    )
    res = evaluate_single_rule(team, valid_rule)
    assert res.status == RuleStatus.PASS
    assert "50%" in res.reason
