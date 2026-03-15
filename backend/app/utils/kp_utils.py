def kp_to_visibility_latitude(kp: float) -> float:
    """
    Approximate the equatorward boundary of aurora visibility (degrees latitude)
    based on Kp index. Higher Kp = aurora visible at lower latitudes.
    Reference: NOAA Space Weather Scale
    """
    # Clamp Kp to valid range
    kp = max(0.0, min(9.0, kp))
    # Linear approximation: Kp 0 -> ~90°, Kp 9 -> ~40°
    return round(90.0 - (kp * 5.5), 1)
