
def calculate_risk(detection):
    score = min(
        100,
        detection["match_count"] * 15 +
        detection["confidence"] * 35
    )

    if score >= 75:
        level = "High"
    elif score >= 45:
        level = "Medium"
    else:
        level = "Low"

    return {
        "score": round(score, 1),
        "level": level,
        "evidence_strength": detection["confidence"],
        "explanation": "Score is derived from prototype detection signals and requires human review."
    }
