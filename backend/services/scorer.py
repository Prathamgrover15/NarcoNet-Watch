SLANG = {
    "ice": 0.6, "hmu": 0.3, "snow": 0.5, "party favor": 0.7,
    "candy": 0.4, "the goods": 0.5, "420": 0.3, "molly": 0.7,
    "green": 0.4, "loud": 0.4, "plug": 0.6, "connect": 0.4,
    "stash": 0.5, "package": 0.3, "delivery": 0.2, "clean": 0.3,
    "drop": 0.3, "usual spot": 0.4
}

def score_text(text):
    text_lower = text.lower()
    flagged = []
    spans = []
    score = 0.0

    for term, weight in SLANG.items():
        idx = text_lower.find(term)
        if idx != -1:
            flagged.append(term)
            spans.append([idx, idx + len(term)])
            score += weight

    if len(flagged) < 2:
        score = min(score, 0.4)

    risk_score = round(min(score, 1.0), 2)
    confidence = round(min(len(flagged) / 3, 1.0), 2)

    return {
        "risk_score": risk_score,
        "confidence": confidence,
        "flagged_terms": flagged,
        "flagged_spans": spans
    }


if __name__ == "__main__":
    import json
    from pathlib import Path

    POSTS_FILE = Path(__file__).parent.parent / "data" / "posts.json"
    with open(POSTS_FILE) as f:
        posts = json.load(f)

    for post in posts:
        result = score_text(post["text"])
        print(post["account"], "->", result)