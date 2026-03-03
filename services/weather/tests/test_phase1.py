"""
Unit tests for Phase 1: NOAA SWPC provider + normalizers.
Run: PYTHONPATH=services/weather pytest services/weather/tests/test_phase1.py -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
import json

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

from providers.noaa_swpc import fetch_noaa_swpc
from normalizers.space_weather import (
    build_space_weather,
    _kp_activity_label,
    _parse_kp_observed,
    _parse_kp_forecast,
    _parse_solar_wind,
    _parse_xray,
    _xray_class,
)
from normalizers.observer_weather import (
    _dew_risk_for_hour,
    _wind_risk_for_hour,
    _worst_risk,
    _seeing_label,
    _transparency_label,
    _compute_derived,
)


# ── NOAA SWPC provider ───────────────────────────────────────────────────────

class TestNoaaSwpcProvider(unittest.TestCase):

    def test_returns_dict_with_expected_keys(self):
        """fetch_noaa_swpc returns all expected keys, even on failure."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"[]"
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)

        with patch("providers.noaa_swpc.urllib.request.urlopen", return_value=mock_response):
            result = fetch_noaa_swpc()

        for key in ("kp_observed", "kp_forecast", "solar_wind", "xray", "alerts"):
            self.assertIn(key, result)

    def test_returns_none_on_fetch_failure(self):
        """fetch_noaa_swpc returns None per product when network fails."""
        with patch("providers.noaa_swpc.urllib.request.urlopen", side_effect=Exception("Network error")):
            result = fetch_noaa_swpc()

        for key in ("kp_observed", "kp_forecast", "solar_wind", "xray", "alerts"):
            self.assertIsNone(result[key])


# ── Space weather normalizer ─────────────────────────────────────────────────

class TestSpaceWeatherNormalizer(unittest.TestCase):

    def test_empty_raw_produces_safe_output(self):
        """build_space_weather({}) never raises and returns valid schema."""
        result = build_space_weather({})
        self.assertIn("generated_utc", result)
        self.assertIn("kp", result)
        self.assertIsNone(result["kp"]["latest"])
        self.assertEqual(result["kp"]["forecast_3h"], [])
        self.assertIsNone(result["kp"]["activity_label"])
        self.assertIsNone(result["solar_wind"])
        self.assertIsNone(result["xray"])
        self.assertEqual(result["alerts"], [])

    def test_none_values_produce_safe_output(self):
        """All None values produce safe null output."""
        raw = {
            "kp_observed": None,
            "kp_forecast": None,
            "solar_wind": None,
            "xray": None,
            "alerts": None,
        }
        result = build_space_weather(raw)
        self.assertIsNone(result["kp"]["latest"])
        self.assertIsNone(result["solar_wind"])

    def test_activity_label_quiet(self):
        self.assertEqual(_kp_activity_label(0.0), "quiet")
        self.assertEqual(_kp_activity_label(3.99), "quiet")

    def test_activity_label_minor(self):
        self.assertEqual(_kp_activity_label(4.0), "minor")
        self.assertEqual(_kp_activity_label(4.67), "minor")

    def test_activity_label_moderate(self):
        self.assertEqual(_kp_activity_label(5.0), "moderate")
        self.assertEqual(_kp_activity_label(5.67), "moderate")

    def test_activity_label_strong(self):
        self.assertEqual(_kp_activity_label(6.0), "strong")
        self.assertEqual(_kp_activity_label(6.67), "strong")

    def test_activity_label_severe(self):
        self.assertEqual(_kp_activity_label(7.0), "severe")
        self.assertEqual(_kp_activity_label(9.0), "severe")

    def test_kp_observed_parses_latest(self):
        rows = [
            ["time_tag", "Kp"],
            ["2026-03-02 09:00:00", "2.00"],
            ["2026-03-02 12:00:00", "3.33"],
        ]
        result = _parse_kp_observed(rows)
        self.assertIsNotNone(result)
        self.assertAlmostEqual(result["value"], 3.33)
        self.assertEqual(result["timestamp_utc"], "2026-03-02T12:00:00Z")

    def test_kp_observed_skips_header(self):
        rows = [["time_tag", "Kp"]]  # only header
        result = _parse_kp_observed(rows)
        self.assertIsNone(result)

    def test_xray_class_derivation(self):
        self.assertEqual(_xray_class(1.5e-4), "X")
        self.assertEqual(_xray_class(5.0e-5), "M")
        self.assertEqual(_xray_class(3.0e-6), "C")
        self.assertEqual(_xray_class(5.0e-7), "B")   # 5e-7 is between 1e-7 and 1e-6
        self.assertEqual(_xray_class(8.0e-8), "A")   # 8e-8 < 1e-7 → A class

    def test_solar_wind_returns_latest(self):
        rows = [
            ["time_tag", "density", "speed", "temperature"],
            ["2026-03-02 08:00:00", "5.2", "420.0", "100000"],
            ["2026-03-02 09:00:00", "4.8", "435.5", "98000"],
        ]
        result = _parse_solar_wind(rows)
        self.assertIsNotNone(result)
        self.assertAlmostEqual(result["speed_kms"], 435.5)
        self.assertAlmostEqual(result["density_protons_cm3"], 4.8)


# ── Observer weather normalizer ──────────────────────────────────────────────

class TestObserverWeatherNormalizer(unittest.TestCase):

    def test_dew_risk_high(self):
        """High dew risk: spread < 2°C AND humidity > 85%."""
        self.assertEqual(_dew_risk_for_hour(10.0, 9.0, 90.0), "high")

    def test_dew_risk_medium_by_spread(self):
        """Medium dew risk: spread < 4°C."""
        self.assertEqual(_dew_risk_for_hour(10.0, 7.5, 60.0), "medium")

    def test_dew_risk_medium_by_humidity(self):
        """Medium dew risk: humidity > 75%."""
        self.assertEqual(_dew_risk_for_hour(15.0, 5.0, 78.0), "medium")

    def test_dew_risk_low(self):
        """Low dew risk: spread >= 4°C AND humidity <= 75%."""
        self.assertEqual(_dew_risk_for_hour(20.0, 5.0, 50.0), "low")

    def test_dew_risk_unknown_missing_temp(self):
        self.assertEqual(_dew_risk_for_hour(None, 5.0, 60.0), "unknown")

    def test_wind_risk_high(self):
        self.assertEqual(_wind_risk_for_hour(9.0), "high")

    def test_wind_risk_medium(self):
        self.assertEqual(_wind_risk_for_hour(6.0), "medium")

    def test_wind_risk_low(self):
        self.assertEqual(_wind_risk_for_hour(3.0), "low")

    def test_wind_risk_unknown_none(self):
        self.assertEqual(_wind_risk_for_hour(None), "unknown")

    def test_worst_risk_ordering(self):
        self.assertEqual(_worst_risk(["low", "high", "medium"]), "high")
        self.assertEqual(_worst_risk(["low", "medium"]), "medium")
        self.assertEqual(_worst_risk(["low"]), "low")
        self.assertEqual(_worst_risk([]), "unknown")

    def test_seeing_label_mapping(self):
        self.assertEqual(_seeing_label(1), "poor")
        self.assertEqual(_seeing_label(2), "poor")
        self.assertEqual(_seeing_label(3), "average")
        self.assertEqual(_seeing_label(4), "good")
        self.assertEqual(_seeing_label(5), "excellent")
        self.assertEqual(_seeing_label(8), "excellent")
        self.assertIsNone(_seeing_label(None))

    def test_transparency_label_mapping(self):
        self.assertEqual(_transparency_label(1), "poor")
        self.assertEqual(_transparency_label(2), "average")
        self.assertEqual(_transparency_label(3), "good")
        self.assertEqual(_transparency_label(4), "excellent")
        self.assertIsNone(_transparency_label(None))

    def test_cloud_window_finds_minimum(self):
        """_compute_derived finds the 2h window with minimum average cloud cover."""
        from datetime import timezone as tz_module
        import datetime as dt_module

        # Build 4 hours of synthetic hourly data
        base = dt_module.datetime(2026, 3, 3, 10, 0, 0, tzinfo=dt_module.timezone.utc)
        hourly = []
        cloud_values = [80, 10, 5, 70]  # lowest consecutive pair: hours 1-2 (10+5)/2=7.5
        for i, cloud in enumerate(cloud_values):
            ts = (base + dt_module.timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ")
            hourly.append({
                "timestamp_utc": ts,
                "cloud": {"total_percent": cloud},
                "air": {"temperature_c": 15.0, "dewpoint_c": 8.0, "humidity_percent": 60.0},
                "wind": {"gust_mps": 3.0},
            })

        now_utc = base - dt_module.timedelta(hours=1)  # before all hours
        derived = _compute_derived(hourly, now_utc)
        window = derived["cloud_window"]
        # Expect hours 1 and 2 (indices 1 and 2, cloud 10 and 5)
        self.assertEqual(window["best_window_start_utc"], hourly[1]["timestamp_utc"])
        self.assertEqual(window["best_window_end_utc"], hourly[2]["timestamp_utc"])


if __name__ == "__main__":
    unittest.main()
