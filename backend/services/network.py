def build_network(posts):
    nodes = {}
    edges = set()

    for post in posts:
        account = post["account"]

        if account not in nodes or post["risk_score"] > nodes[account]["risk_score"]:
            nodes[account] = {
                "id": account,
                "label": account,
                "risk_score": post["risk_score"],
                "status": post.get("status", "Flagged"),
            }

        for connection in post.get("connections", []):
            if connection not in nodes:
                nodes[connection] = {
                    "id": connection,
                    "label": connection,
                    "risk_score": 0,
                    "status": "Unreviewed",
                }
            edge_key = tuple(sorted((account, connection)))
            edges.add(edge_key)

    edge_list = [
        {"source": source, "target": target, "relationship": "observed_interaction"}
        for source, target in edges
    ]

    return {"nodes": list(nodes.values()), "edges": edge_list}
