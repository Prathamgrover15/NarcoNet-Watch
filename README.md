# 🛡️ NarcoNetWatch

**NarcoNetWatch** is a unified intelligence dashboard prototype for monitoring and analyzing potentially suspicious online activity. It combines a Python/Flask backend with a React/Vite frontend to present posts, risk scores, flagged terms, account connections, investigation status, and additional intelligence fields in one interface.

> **Hackathon / educational prototype:** The included records are simulated demonstration data. This project is not a real-world intelligence system and should not be used as a basis for automated enforcement or real-world accusations.

## 🔗 Live Demo

Frontend deployed on Vercel: [https://YOUR-PROJECT-NAME.vercel.app](https://YOUR-PROJECT-NAME.vercel.app)

> Note: the live demo shows the frontend only. The Flask backend needs to be deployed separately (e.g. Render or Railway) and the frontend's API base URL updated to point to it — otherwise the dashboard will show a "backend not running" error.

## ✨ Features

- Unified admin dashboard
- Post and account monitoring
- Risk-score visualization
- Flagged-term display and highlighting
- Investigation status management
- Account connection/network visualization
- Location and timestamp information
- Search and risk-based sorting
- JSON-based prototype data store
- Flask REST API
- React + Vite frontend
- Automatically displays additional fields added to `posts.json`

## 🧰 Tech Stack

**Frontend:** React 19, Vite, JavaScript/JSX, CSS, Lucide React  
**Backend:** Python, Flask, Flask-CORS  
**Data:** JSON

## 📁 Project Structure

```text
NarcoNetWatch/
├── backend/
│   ├── app.py
│   ├── data/
│   │   └── posts.json
│   ├── services/
│   │   ├── detection.py
│   │   ├── graph.py
│   │   ├── network.py
│   │   ├── risk.py
│   │   ├── scorer.py
│   │   └── store.py
│   ├── requirements.txt
│   └── test_api.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── dashboard.jsx
│   │   ├── index.css
│   │   ├── loginscreen.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## ⚙️ Requirements

- Python 3.10+
- Node.js 18+
- npm
- Git

## 🚀 How to Run

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/NarcoNetWatch.git
cd NarcoNetWatch
```

Replace `YOUR-USERNAME` with the GitHub username that owns the repository.

### 2. Start the backend

Open Terminal 1:

```bash
cd backend
python -m venv .venv
```

**Windows CMD:**
```bash
.venv\Scripts\activate
```

**Windows PowerShell:**
```powershell
.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

Install dependencies and start Flask:

```bash
pip install -r requirements.txt
python app.py
```

The API runs on `http://localhost:5000`.

### 3. Start the frontend

Open Terminal 2 from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

Keep both terminals running while using the application.

## 🔄 Frontend + Backend Flow

```text
posts.json
    ↓
Flask Backend
    ↓
REST API (/api/posts)
    ↓
React Frontend
    ↓
NarcoNetWatch Dashboard
```

The backend preserves values explicitly supplied in `posts.json` and only uses the scorer to fill fields that are missing. This keeps manually curated demo values such as `risk_score` and `flagged_terms` visible.

The frontend also detects extra fields in each post and displays them under **Additional Intelligence**, so basic new properties added to `posts.json` can be displayed without another UI change.

## 🗃️ Editing Demo Data

The main data file is:

```text
backend/data/posts.json
```

Example:

```json
{
  "post_id": "p012",
  "account": "example_user",
  "text": "example post",
  "timestamp": "2026-08-23T12:00:00",
  "location": "Chennai",
  "risk_score": 0.72,
  "flagged_terms": ["example"],
  "connections": ["user_abc"],
  "status": "Flagged"
}
```

Any additional fields you add to a post beyond these will automatically appear in the dashboard's **Additional Intelligence** section — no frontend changes needed.

## 🧪 Testing

From the `backend` directory:

```bash
python test_api.py
```

## 📌 GitHub Notes

The repository intentionally excludes generated/dependency directories such as:

- `backend/.venv/`
- `frontend/node_modules/`
- `frontend/dist/`
- Python cache files
- `.env` files

After cloning, `pip install -r requirements.txt` and `npm install` recreate the required dependencies locally.

## 👥 Team Credits

| Team Member | Responsibility |
|---|---|
| **Pratham Grover** | Backend and Compiling |
| **Aman Sharma** | Backend |
| **Ritesh Kumar** | Frontend |
| **Garvit Singhal** | Frontend |

## 🎯 Project Purpose

NarcoNetWatch was developed as a collaborative prototype demonstrating how backend data processing, risk analysis, account monitoring, and frontend visualization can be integrated into a single administrative dashboard.

## ⚠️ Disclaimer

This project is intended for educational, demonstration, and hackathon purposes. The data included in this repository is simulated/demo data and should not be treated as verified real-world intelligence. The system is designed for human review and does not perform automated enforcement actions.
