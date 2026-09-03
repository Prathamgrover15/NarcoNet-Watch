# NarcoNet Watch — Backend

Flask REST API prototype for the NarcoNet Watch hackathon project.

The pitch deck describes a four-layer pipeline: detection, network mapping,
risk scoring, and human-in-the-loop review. This backend implements those
prototype boundaries as independent services.

## Architecture

```text
React Dashboard
      |
      v
 Flask REST API
      |
      +--> Detection Engine
      |      - context/rule prototype
      |
      +--> Risk Engine
      |      - explainable score
      |
      +--> Network Layer
      |      - nodes + relationships
      |
      +--> JSON Evidence Store
             - synthetic prototype data
```

## Run locally

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

API runs at `http://localhost:5000`.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/accounts` | Risk-sorted investigator leads |
| GET | `/api/accounts/<id>` | Account detail |
| POST | `/api/analyze` | Analyze supplied text |
| GET | `/api/network` | Network graph data |
| PATCH | `/api/accounts/<id>/status` | Human review status |

### Analyze example

```json
POST /api/analyze

{
  "text": "sample_codeword delivery"
}
```

The response contains detection matches, confidence, an explainable risk
score, and an explicit `human_review_required` flag.

### Update investigation status

```json
PATCH /api/accounts/ACC-001/status

{
  "status": "Under Investigation"
}
```

Allowed states:

- Flagged
- Under Investigation
- False Positive

## Frontend integration

From React:

```js
const response = await fetch("http://localhost:5000/api/accounts");
const data = await response.json();
```

For a network graph:

```js
const response = await fetch("http://localhost:5000/api/network");
const graph = await response.json();
```

The returned structure is intentionally simple so it can be passed into
Cytoscape.js or vis.js.

## Important prototype boundary

This repository uses synthetic account records and placeholder detection
terms. Do not connect it to unauthorized scraping, private communications,
or real-person profiling.

The system is an intelligence-support prototype: flags and scores are leads
for human investigators, not automated accusations or enforcement decisions.
