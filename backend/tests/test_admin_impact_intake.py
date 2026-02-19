"""Admin impact-intake endpoint and SDG aggregations. Requires no DB when testing _compute_sdg_theme_counts."""
import os

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routes.admin_routes import _compute_sdg_theme_counts


def test_compute_sdg_theme_counts_empty():
    assert _compute_sdg_theme_counts([]) == {}
    assert _compute_sdg_theme_counts([{}]) == {}
    assert _compute_sdg_theme_counts([{"themes": ["livelihoods_income"]}]) == {}


def test_compute_sdg_theme_counts_only_counts_when_sdg_themes_present():
    # Profile with no sdg_themes is skipped (do not infer from themes)
    profiles = [{"themes": ["livelihoods_income"], "sdg_themes": None}]
    assert _compute_sdg_theme_counts(profiles) == {}
    profiles = [{}]
    assert _compute_sdg_theme_counts(profiles) == {}


def test_compute_sdg_theme_counts_small_sample():
    profiles = [
        {"sdg_themes": ["sdg_1", "sdg_4"]},
        {"sdg_themes": ["sdg_1", "sdg_17"]},
        {"sdg_themes": ["sdg_4"]},
    ]
    got = _compute_sdg_theme_counts(profiles)
    assert got["sdg_1"] == 2
    assert got["sdg_4"] == 2
    assert got["sdg_17"] == 1


def test_compute_sdg_theme_counts_ignores_non_strings_and_empty():
    profiles = [
        {"sdg_themes": ["sdg_1", "", "sdg_2", 3, None]},
    ]
    got = _compute_sdg_theme_counts(profiles)
    assert got["sdg_1"] == 1
    assert got["sdg_2"] == 1
    assert "3" not in got
    assert "" not in got


@pytest.mark.skipif(
    not os.environ.get("ADMIN_API_KEY"),
    reason="ADMIN_API_KEY not set; integration test skipped",
)
def test_impact_intake_response_includes_sdg_theme_counts():
    """With real DB and ADMIN_API_KEY set, GET impact-intake returns sdg_theme_counts in aggregations."""
    client = TestClient(app)
    r = client.get(
        "/api/admin/impact-intake",
        headers={"Admin-Api-Key": os.environ["ADMIN_API_KEY"]},
    )
    if r.status_code == 403:
        pytest.skip("Admin key not accepted (e.g. test env)")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "investor" in data
    assert "aggregations" in data["investor"]
    assert "sdg_theme_counts" in data["investor"]["aggregations"]
    assert isinstance(data["investor"]["aggregations"]["sdg_theme_counts"], dict)
