## Post Schema (data/posts.json)

Every post object has these fields:

| Field | Type | Description |
|---|---|---|
| post_id | string | Unique identifier, e.g. "p001" |
| account | string | The account that made the post |
| text | string | Raw post content |
| timestamp | ISO 8601 string | When the post was made |
| location | string | City/region tag |
| risk_score | float (0.0–1.0) | Output of the detection+risk pipeline |
| flagged_terms | array[string] | Which terms triggered the score |
| connections | array[string] | Other accounts linked to this post |
| status | string | One of: "Flagged", "Under Investigation","False Positive" |