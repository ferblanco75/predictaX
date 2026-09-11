"""Regression tests for #259 finding 1: CORS regex was too broad."""

import re

from app.main import cors_origin_regex


def test_cors_regex_rejects_arbitrary_vercel_subdomain():
    assert re.fullmatch(cors_origin_regex, "https://evil-site.vercel.app") is None


def test_cors_regex_rejects_attacker_controlled_project_name():
    assert re.fullmatch(cors_origin_regex, "https://predicta-x-evil.vercel.app") is None


def test_cors_regex_accepts_real_project_preview():
    origin = "https://predicta-x-git-develop-sprint2-fernandoblancos-projects.vercel.app"
    assert re.fullmatch(cors_origin_regex, origin) is not None


def test_cors_regex_has_no_suffix_bypass():
    """A subdomain trick like evil.vercel.app.attacker.com must not match."""
    origin = "https://predicta-x-git-main-fernandoblancos-projects.vercel.app.attacker.com"
    assert re.fullmatch(cors_origin_regex, origin) is None
