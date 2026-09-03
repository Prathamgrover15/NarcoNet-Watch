import json
from pathlib import Path

POSTS_FILE = Path(__file__).parent.parent / "data" / "posts.json"


def load_posts():
    """Every other layer calls this — never reads posts.json directly.
    Swapping this file's body for a real database query is the ONLY change
    needed to move from prototype to production."""
    with open(POSTS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def save_posts(posts):
    """Same idea — this is the only place a write happens."""
    with open(POSTS_FILE, "w", encoding="utf-8") as file:
        json.dump(posts, file, indent=2)