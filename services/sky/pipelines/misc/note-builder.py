# services/sky/pipelines/note_builder.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from math import isfinite
from typing import Optional

def _clamp(x: float, a: float, b: float) -> float:
    return max(a, min(b, x))

def _fmt_hhmm(dt: datetime) -> str:
    # expects timezone-aware local time
    return dt.strftime("%H:%M")

def az_to_dir_en(az_deg: float) -> str:
    """
    Horizon azimuth convention assumed: 0=N, 90=E, 180=S, 270=W.
    Returns short English direction phrase.
    """
    a = (az_deg % 360.0 + 360.0) % 360.0
    # 8-wind
    if a < 22.5 or a >= 337.5: return "to the north"
    if a < 67.5:  return "to the north-east"
    if a < 112.5: return "to the east"
    if a < 157.5: return "to the south-east"
    if a < 202.5: return "to the south"
    if a < 247.5: return "to the south-west"
    if a < 292.5: return "to the west"
    return "to the north-west"

def darkness_phrase_en(twilight_band: Optional[str]) -> str:
    """
    twilight_band suggested values:
      - "civil" (Sun alt between -6..0 or -6..-12 depending on your definition)
      - "nautical"
      - "astronomical"
      - "day"
      - None
    Keep it short and user-friendly.
    """
    if twilight_band == "astronomical":
        return "in full darkness"
    if twilight_band == "nautical":
        return "in dark twilight"
    if twilight_band == "civil":
        return "in twilight"
    if twilight_band == "day":
        return "in daylight"
    return ""  # unknown -> omit

def moon_phrase_en(moon_penalty: Optional[float]) -> str:
    """
    moon_penalty: 0..1, where 0 = no impact, 1 = strong impact.
    """
    if moon_penalty is None or not isfinite(moon_penalty):
        return ""
    p = _clamp(float(moon_penalty), 0.0, 1.0)
    if p >= 0.75:
        return "Moonlight will likely wash out faint detail—prefer a transparent night or wait for a darker window."
    if p >= 0.45:
        return "Some moonlight is present—contrast on faint targets may be reduced."
    return ""

def meridian_phrase_en(meridian_bonus: Optional[float]) -> str:
    """
    meridian_bonus: you can store a 0..1 “closeness to meridian”.
    If you store something else (deg), adjust mapping.
    """
    if meridian_bonus is None or not isfinite(meridian_bonus):
        return ""
    m = _clamp(float(meridian_bonus), 0.0, 1.0)
    if m >= 0.8:
        return "It sits close to the meridian (best seeing / minimal airmass)."
    if m >= 0.55:
        return "It approaches the meridian during this window."
    return ""

@dataclass(frozen=True)
class NoteInputs:
    name: str
    kind: str  # "event" | "planet" | "ss" (asteroid/comet) | "dso" | etc.
    best_from_local: Optional[datetime]
    best_to_local: Optional[datetime]
    best_alt_deg: Optional[float]
    best_az_deg: Optional[float]
    twilight_band: Optional[str] = None
    moon_penalty: Optional[float] = None
    meridian_bonus: Optional[float] = None
    low_alt_threshold_deg: float = 12.0

def build_visibility_note_en(inp: NoteInputs) -> str:
    """
    Returns a compact 1–2 sentence note in English.
    Uses only deterministic rules (no LLM).
    """

    # time window
    t_part = ""
    if inp.best_from_local and inp.best_to_local:
        t_part = f"Best from {_fmt_hhmm(inp.best_from_local)} to {_fmt_hhmm(inp.best_to_local)}"
    elif inp.best_from_local:
        t_part = f"Best after {_fmt_hhmm(inp.best_from_local)}"
    elif inp.best_to_local:
        t_part = f"Best before {_fmt_hhmm(inp.best_to_local)}"
    else:
        t_part = "Best visibility varies through the night"

    # darkness
    dark = darkness_phrase_en(inp.twilight_band)
    if dark:
        t_part += f" {dark}"

    # direction
    dir_part = ""
    if inp.best_az_deg is not None and isfinite(inp.best_az_deg):
        dir_part = az_to_dir_en(float(inp.best_az_deg))

    # altitude
    alt_part = ""
    if inp.best_alt_deg is not None and isfinite(inp.best_alt_deg):
        alt = float(inp.best_alt_deg)
        alt_part = f"reaching {alt:.0f}° altitude"
        if alt < inp.low_alt_threshold_deg:
            alt_part += " (low—transparency matters)"

    # assemble sentence 1
    bits = []
    if dir_part:
        bits.append(dir_part)
    if alt_part:
        bits.append(alt_part)

    if bits:
        s1 = f"{t_part} {', '.join(bits)}."
    else:
        s1 = f"{t_part}."

    # sentence 2: meridian / moon hints (short, optional)
    s2_parts = []
    mp = meridian_phrase_en(inp.meridian_bonus)
    if mp:
        s2_parts.append(mp)

    moon = moon_phrase_en(inp.moon_penalty)
    if moon:
        s2_parts.append(moon)

    # events get a slightly different tone
    if inp.kind == "event":
        # Keep it compact but “headline-like”
        # (you can tweak later based on event subtype)
        pass

    if s2_parts:
        return s1 + " " + " ".join(s2_parts)

    return s1