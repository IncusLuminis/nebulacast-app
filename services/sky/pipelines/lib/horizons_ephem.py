# services/sky/pipelines/lib/horizons_ephem.py

from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

from astroquery.jplhorizons import Horizons
from astroquery.jplhorizons import conf as horizons_conf
from astropy.time import Time


@dataclass(frozen=True)
class Site:
    lat: float
    lon: float
    elev_km: float


def _as_float(x: Any) -> Optional[float]:
    try:
        v = float(x)
        return v if (v == v) else None  # NaN check
    except Exception:
        return None


def _get_col_value(tab, *names: str) -> Any:
    for n in names:
        if n in tab.colnames:
            return tab[n][0]
    return None


def horizons_ephem_at_jd(
    target: str,
    jd: float,
    site: Site,
    *,
    quantities: str = "1,4,9,10",
    retries: int = 4,
    timeout_s: int = 25,
    sleep_between_retries_s: float = 0.6,
) -> Optional[Dict[str, Any]]:
    """
    Fetch topocentric ephemerides for a single epoch.
    We pass epochs as a single JD float (CAD provides JD already).
    """
    horizons_conf.timeout = timeout_s

    location = {"lon": site.lon, "lat": site.lat, "elevation": site.elev_km}

    # CAD 'jd' is typically TDB. Horizons accepts JD epochs; we pass it as-is.
    # Using astropy Time keeps this explicit (and easy to adjust later if needed).
    epoch_jd = float(Time(jd, format="jd", scale="tdb").jd)

    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            obj = Horizons(id=target, id_type="smallbody", location=location, epochs=epoch_jd)
            tab = obj.ephemerides(quantities=quantities)
            if len(tab) < 1:
                return None

            ra = _as_float(_get_col_value(tab, "RA"))
            dec = _as_float(_get_col_value(tab, "DEC"))
            alt = _as_float(_get_col_value(tab, "EL", "Alt"))
            az = _as_float(_get_col_value(tab, "AZ", "Az"))

            # Small bodies usually provide V. Be tolerant on naming.
            mag = _as_float(_get_col_value(tab, "V", "VMag", "Vmag", "MAG", "mag"))

            if ra is None or dec is None:
                return None

            out: Dict[str, Any] = {
                "ra_deg": ra,
                "dec_deg": dec,
                "alt_deg": alt,
                "az_deg": az,
            }
            if mag is not None:
                out["mag"] = round(mag, 2)
            return out

        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(sleep_between_retries_s * attempt)
                continue
            break

    return None