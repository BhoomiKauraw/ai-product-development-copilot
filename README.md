
# AI Product Development Copilot

An AI-powered product planning tool that helps turn product ideas into structured Product Requirements Documents (PRDs) and prioritize features using the RICE scoring framework.

## Features

- **AI-powered PRD generation:** Generate a structured product plan from a product idea using Google's Gemini API.
- **PRD history:** Save generated plans in SQLite and revisit previously created documents.
- **RICE prioritization:** Rank features using Reach, Impact, Confidence, and Effort.
- **Markdown export:** Download generated PRDs as Markdown files.
- **Input validation:** Validate feature prioritization inputs using Pydantic.
- **Automated tests:** Test RICE calculations, API endpoints, validation, and error handling.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| AI | Google Gemini API |
| Validation | Pydantic |
| Database | SQLite |
| Testing | Pytest, FastAPI TestClient |

## Architecture

```text
React + TypeScript frontend
          |
          | HTTP requests
          v
      FastAPI backend
          |
          +---- Gemini API
          |
          +---- SQLite database
```

The frontend communicates with the backend through HTTP endpoints. The Gemini API key is configured on the backend and should never be exposed in frontend code.

## Getting Started

### Prerequisites

- Python 3.10 or newer
- Node.js and npm
- A Google Gemini API key for AI-powered PRD generation

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ai-product-copilot
```

Replace the placeholder URL with your GitHub repository URL after publishing the project.

### 2. Configure the backend

Open a terminal in the `backend` directory:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
python -m pip install fastapi uvicorn google-genai python-dotenv pytest httpx
```

Create a file named `.env` inside `backend` and add your own Gemini API key:

```dotenv
GEMINI_API_KEY=your_actual_api_key_here
```

Replace the placeholder with your actual key locally. Never commit your `.env` file or share its contents.

Start the backend:

```bash
uvicorn app.main:app --reload
```

The backend should be available at:

- Health check: http://127.0.0.1:8000/health
- API documentation: http://127.0.0.1:8000/docs

### 3. Start the frontend

Open a second terminal from the repository root:

```bash
cd frontend/frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

http://localhost:5173

Keep both the backend and frontend terminals running while using the application.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend health |
| POST | `/api/prd` | Generate and save a PRD |
| GET | `/api/prds` | Retrieve saved PRDs |
| POST | `/api/rice` | Calculate and rank feature priorities |

Interactive API documentation is available at `/docs` when the backend is running.

## Running Tests

From the `backend` directory, activate your virtual environment and run:

```bash
python -m pytest -v
```

The current test suite covers RICE calculations, feature validation, API responses, PRD error handling, and PRD history.

## RICE Scoring

The application calculates the RICE score using:

**RICE Score = Reach × Impact × Confidence / Effort**

Confidence is entered as a percentage and converted into a fraction for the calculation. Features with higher scores are ranked first.

RICE scores are estimates to support prioritization, not guarantees of product success.

## Security Notes

- Store the Gemini API key in `backend/.env`.
- Keep `.env` out of Git and never place API keys in frontend code.
- Use `.env.example` as a placeholder template only.
- Configure environment variables securely when deploying the application.

## Future Improvements

- Add user authentication and individual workspaces.
- Improve the interface for editing and managing PRDs.
- Add additional test coverage and continuous integration.
- Deploy the frontend and backend.
- Support more export formats.

## Author

Built as a hands-on software engineering and AI product development project.
