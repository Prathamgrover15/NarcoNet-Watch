
KEYWORDS = {
    "coded_language": ["sample_codeword", "sample_term"],
    "transaction_signal": ["price", "quantity", "delivery"],
    "coordination_signal": ["meet", "drop", "route"]
}

def analyze_text(text):
    normalized = text.lower()
    matches = []

    for category, terms in KEYWORDS.items():
        for term in terms:
            if term in normalized:
                matches.append({"term": term, "category": category})

    confidence = min(0.99, 0.35 + 0.12 * len(matches))
    return {
        "flagged": bool(matches),
        "matches": matches,
        "match_count": len(matches),
        "confidence": round(confidence, 2) if matches else 0.05
    }
