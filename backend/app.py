
import os

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from services.detection import analyze_text
from services.risk import calculate_risk
from services.network import build_network
from services.store import load_posts, save_posts
from services.scorer import score_text
from services.graph import build_graph, find_hubs, to_network_format
from pathlib import Path

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
CORS(app)
ALLOWED_STATUSES = {"Flagged", "Under Investigation", "False Positive"}
def _aggregate_accounts(posts):
    accounts = {}
    for post in posts:
        acct = post["account"]
        if acct not in accounts:
            accounts[acct] = {
                "account": acct,
                "location": post.get("location"),
                "risk_score": 0,
                "status": post.get("status", "Flagged"),
                "post_count": 0,
                "flagged_terms": set(),
                "connections": set(),
                "latest_timestamp": post.get("timestamp", ""),
            }
        entry = accounts[acct]
        entry["post_count"] += 1
        entry["flagged_terms"].update(post.get("flagged_terms", []))
        entry["connections"].update(post.get("connections", []))
        if post["risk_score"] >= entry["risk_score"]:
            entry["risk_score"] = post["risk_score"]
            entry["status"] = post.get("status", entry["status"])
        if post.get("timestamp", "") > entry["latest_timestamp"]:
            entry["latest_timestamp"] = post["timestamp"]

    result = []
    for entry in accounts.values():
        entry["flagged_terms"] = sorted(entry["flagged_terms"])
        entry["connections"] = sorted(entry["connections"])
        result.append(entry)
    return result

def _rescan_posts(posts):
    """Enrich posts with scorer output without overwriting curated JSON fields."""
    for post in posts:
        result = score_text(post.get("text", ""))
        post.setdefault("risk_score", result["risk_score"])
        post.setdefault("confidence", result["confidence"])
        post.setdefault("flagged_terms", result["flagged_terms"])
        post.setdefault("flagged_spans", result["flagged_spans"])
    return posts

@app.get("/api/accounts")
def get_accounts():
    posts = _rescan_posts(load_posts())
    accounts = _aggregate_accounts(posts)

    status = request.args.get("status")
    min_risk = request.args.get("min_risk", type=float)
    if status:
        accounts = [a for a in accounts if a["status"].lower() == status.lower()]
    if min_risk is not None:
        accounts = [a for a in accounts if a["risk_score"] >= min_risk]

    accounts.sort(key=lambda a: a["risk_score"], reverse=True)
    return jsonify({"count": len(accounts), "accounts": accounts})


@app.get("/api/accounts/<account_id>")
def account_detail(account_id):
    posts = _rescan_posts(load_posts())
    account_posts = [p for p in posts if p["account"] == account_id]
    if not account_posts:
        return jsonify({"error": "Account not found"}), 404
    detail = _aggregate_accounts(account_posts)[0]
    detail["posts"] = account_posts
    return jsonify(detail)

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "NarcoNet Watch Intelligence API"})


@app.post("/api/analyze")
def analyze():
    body = request.get_json(silent=True) or {}
    text = body.get("text", "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400

    detection = analyze_text(text)
    risk = calculate_risk(detection)

    return jsonify({
        "detection": detection,
        "risk": risk,
        "human_review_required": True,
        "automated_enforcement": False
    })
@app.get("/api/posts")
def get_posts():
    posts = _rescan_posts(load_posts())

    return jsonify({
        "count": len(posts),
        "posts": posts
    })
@app.get("/api/network")
def get_network():
    posts = _rescan_posts(load_posts())
    g = build_graph(posts)
    hubs = find_hubs(g)
    return jsonify(to_network_format(posts, g, hubs))
@app.patch("/api/posts/<post_id>/status")
def update_post_status(post_id):
    body = request.get_json(silent=True) or {}
    new_status = body.get("status")
    if new_status not in ALLOWED_STATUSES:
        return jsonify({"error": f"status must be one of {sorted(ALLOWED_STATUSES)}"}), 400

    posts = load_posts()
    post = next((p for p in posts if p["post_id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    post["status"] = new_status
    save_posts(posts)
    return jsonify(post)

# Serve the compiled React application when frontend/dist exists.
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "API route not found"}), 404

    requested = FRONTEND_DIST / path
    if path and requested.is_file():
        return send_from_directory(FRONTEND_DIST, path)

    index_file = FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return send_from_directory(FRONTEND_DIST, "index.html")

    return jsonify({
        "service": "NarcoNet Watch",
        "message": "Frontend is not built. Run `npm run build` inside frontend."
    }), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG", "0") == "1")
