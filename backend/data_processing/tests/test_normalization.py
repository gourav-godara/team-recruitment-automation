"""Unit tests for Phase 3 Normalization components."""

import unittest
from normalization import (
    ExperienceNormalizer,
    LinkNormalizer,
    NormalizationService,
    SkillNormalizer,
)
from schemas.member import MemberData


class TestNormalization(unittest.TestCase):
    def setUp(self):
        self.link_norm = LinkNormalizer()
        self.skill_norm = SkillNormalizer()
        self.exp_norm = ExperienceNormalizer()
        self.service = NormalizationService()

    # --- Link Normalizer Tests ---

    def test_github_normal_values(self):
        # Handle format
        url, user = self.link_norm.normalize_github("@octocat")
        self.assertEqual(url, "https://github.com/octocat")
        self.assertEqual(user, "octocat")

        # Full URL format
        url, user = self.link_norm.normalize_github("https://github.com/torvalds")
        self.assertEqual(url, "https://github.com/torvalds")
        self.assertEqual(user, "torvalds")

        # URL with trailing slash
        url, user = self.link_norm.normalize_github("https://github.com/torvalds/")
        self.assertEqual(url, "https://github.com/torvalds")
        self.assertEqual(user, "torvalds")

        # Bare domain format
        url, user = self.link_norm.normalize_github("github.com/gvanrossum")
        self.assertEqual(url, "https://github.com/gvanrossum")
        self.assertEqual(user, "gvanrossum")

    def test_github_missing_and_placeholders(self):
        for val in [None, "", "   ", "none", "N/A", "null", "-", "nil"]:
            url, user = self.link_norm.normalize_github(val)
            self.assertIsNone(url, f"Expected None for {val}")
            self.assertIsNone(user, f"Expected None for {val}")

    def test_github_malformed_does_not_invent_username(self):
        # Invalid / unparseable formats should preserve raw value and NOT invent a username
        malformed = "https://not-github.com/some/path"
        url, user = self.link_norm.normalize_github(malformed)
        self.assertEqual(url, malformed)
        self.assertIsNone(user)

        random_text = "some random text with spaces"
        url, user = self.link_norm.normalize_github(random_text)
        self.assertEqual(url, random_text)
        self.assertIsNone(user)

    def test_linkedin_normalization(self):
        # Normal profile
        url = self.link_norm.normalize_linkedin("linkedin.com/in/ada-lovelace")
        self.assertEqual(url, "https://www.linkedin.com/in/ada-lovelace")

        url2 = self.link_norm.normalize_linkedin("https://www.linkedin.com/in/ada-lovelace/")
        self.assertEqual(url2, "https://www.linkedin.com/in/ada-lovelace")

        # Missing
        self.assertIsNone(self.link_norm.normalize_linkedin(None))
        self.assertIsNone(self.link_norm.normalize_linkedin("n/a"))

    def test_portfolio_normalization(self):
        self.assertEqual(self.link_norm.normalize_portfolio("myblog.dev"), "https://myblog.dev")
        self.assertEqual(
            self.link_norm.normalize_portfolio("https://portfolio.org"),
            "https://portfolio.org",
        )
        self.assertIsNone(self.link_norm.normalize_portfolio(""))
        self.assertIsNone(self.link_norm.normalize_portfolio("none"))

    # --- Skill Normalizer Tests ---

    def test_skills_normal_splitting_and_synonyms(self):
        raw = "Python, React.js; Node.js / Docker | Kubernetes"
        skills = self.skill_norm.normalize_skills(raw)
        expected = ["python", "react", "nodejs", "docker", "kubernetes"]
        self.assertEqual(skills, expected)

    def test_skills_deduplication_and_casing(self):
        raw = "python, React, react.js, PYTHON, ReactJS, GoLang, go"
        skills = self.skill_norm.normalize_skills(raw)
        self.assertEqual(skills, ["python", "react", "go"])

    def test_skills_missing_and_placeholders(self):
        self.assertEqual(self.skill_norm.normalize_skills(None), [])
        self.assertEqual(self.skill_norm.normalize_skills(""), [])
        self.assertEqual(self.skill_norm.normalize_skills("none"), [])
        self.assertEqual(self.skill_norm.normalize_skills("n/a"), [])

    def test_skills_does_not_invent(self):
        # Empty inputs must never produce skills
        self.assertEqual(self.skill_norm.normalize_skills("no skills"), [])

    # --- Experience Normalizer Tests ---

    def test_experience_normal_values(self):
        self.assertEqual(self.exp_norm.normalize_experience(3), 3.0)
        self.assertEqual(self.exp_norm.normalize_experience(2.5), 2.5)
        self.assertEqual(self.exp_norm.normalize_experience("3"), 3.0)
        self.assertEqual(self.exp_norm.normalize_experience("3 years"), 3.0)
        self.assertEqual(self.exp_norm.normalize_experience("2.5 yrs"), 2.5)
        self.assertEqual(self.exp_norm.normalize_experience("3+"), 3.0)
        self.assertEqual(self.exp_norm.normalize_experience("3+ years"), 3.0)
        self.assertEqual(self.exp_norm.normalize_experience("6 months"), 0.5)

    def test_experience_boundary_zero(self):
        self.assertEqual(self.exp_norm.normalize_experience(0), 0.0)
        self.assertEqual(self.exp_norm.normalize_experience("0 years"), 0.0)

    def test_experience_never_infers_from_student_or_words(self):
        # Explicit requirements: Never infer experience from words such as "student"
        for val in [
            "student",
            "freshman",
            "sophomore",
            "junior",
            "senior",
            "fresher",
            "beginner",
            "college student",
            "undergraduate",
            "none",
            "n/a",
            "",
            None,
        ]:
            result = self.exp_norm.normalize_experience(val)
            self.assertIsNone(result, f"Expected None for {val}, got {result}")

    def test_experience_negative_values(self):
        self.assertIsNone(self.exp_norm.normalize_experience(-1))
        self.assertIsNone(self.exp_norm.normalize_experience("-2 years"))

    # --- Normalization Service End-to-End ---

    def test_normalization_service_member_compatibility(self):
        raw_member = {
            "id": "m_test",
            "name": "  Grace   Hopper  ",
            "email": "  GRACE@NAVY.MIL  ",
            "github_url": "@gracehopper",
            "linkedin_url": "linkedin.com/in/gracehopper",
            "portfolio_url": "gracehopper.org",
            "skills": "COBOL, FORTRAN, Fortran, py",
            "experience_years": "5+ years",
            "education": "  Yale University  ",
            "extra_data": {},
        }
        normalized = self.service.normalize_member(raw_member)

        self.assertEqual(normalized["name"], "Grace Hopper")
        self.assertEqual(normalized["email"], "grace@navy.mil")
        self.assertEqual(normalized["github_url"], "https://github.com/gracehopper")
        self.assertEqual(normalized["github_username"], "gracehopper")
        self.assertEqual(normalized["skills"], ["cobol", "fortran", "python"])
        self.assertEqual(normalized["experience_years"], 5.0)
        self.assertEqual(normalized["education"], "Yale University")

        # Crucial check: verify that Pydantic MemberData instantiates seamlessly
        member = MemberData(**normalized)
        self.assertEqual(member.name, "Grace Hopper")
        self.assertEqual(member.experience_years, 5.0)
        self.assertEqual(member.skills, ["cobol", "fortran", "python"])


if __name__ == "__main__":
    unittest.main()
