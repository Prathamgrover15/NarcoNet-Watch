def build_graph(posts):
    graph = {}
    for post in posts:
        acc = post['account']
        graph.setdefault(acc, set())
        for conn in post.get('connections', []):
            graph[acc].add(conn)
            graph.setdefault(conn, set()).add(acc)
    return graph

def find_hubs(graph, min_connections=3):
    return {acc for acc, conns in graph.items() if len(conns) >= min_connections}

def find_rings(graph, min_size=3):
    visited = set()
    rings = []
    for start in graph:
        if start in visited:
            continue
        component = set()
        stack = [start]
        while stack:
            node = stack.pop()
            if node in component:
                continue
            component.add(node)
            stack.extend(graph.get(node, []))
        visited |= component
        if len(component) >= min_size:
            rings.append(sorted(component))
    return rings

def to_network_format(posts, graph, hubs):
    """Matches the shape /api/network in app.py already returns,
    plus is_hub and rings_detected added on top."""
    risk_by_account = {p["account"]: p["risk_score"] for p in posts}
    status_by_account = {p["account"]: p.get("status", "Flagged") for p in posts}

    nodes = []
    for acc in graph:
        nodes.append({
            "id": acc,
            "label": acc,
            "risk_score": risk_by_account.get(acc, 0),
            "status": status_by_account.get(acc, "Unreviewed"),
            "is_hub": acc in hubs
        })

    edges = []
    seen = set()
    for acc, conns in graph.items():
        for conn in conns:
            key = tuple(sorted([acc, conn]))
            if key not in seen:
                seen.add(key)
                edges.append({"source": key[0], "target": key[1], "relationship": "observed_interaction"})

    rings = find_rings(graph)
    return {"nodes": nodes, "edges": edges, "rings_detected": len(rings), "rings": rings}


if __name__ == "__main__":
    import json
    from pathlib import Path

    POSTS_FILE = Path(__file__).parent.parent / "data" / "posts.json"
    with open(POSTS_FILE) as f:
        posts = json.load(f)

    g = build_graph(posts)
    hubs = find_hubs(g)
    rings = find_rings(g)
    print("Hubs:", hubs)
    print("Number of rings:", len(rings))
    for r in rings:
        print(" ring:", r, f"(size {len(r)})")