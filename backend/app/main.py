import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

from .ai_service import generate_prd_content
from .database import initialize_database, save_prd, get_all_prds
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from .rice import RiceRequest, rank_features

from .ai_service import generate_prd_content

app = FastAPI(title="AI Product Development Copilot")
initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PRDRequest(BaseModel):
    idea: str = Field(min_length=10, max_length=3000)


class PRDResponse(BaseModel):
    id: int | None = None
    title: str
    problem_statement: str
    target_users: list[str]
    goals: list[str]
    features: list[str]
    user_stories: list[str]
    assumptions: list[str]


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backend is running!",
    }


@app.post("/api/prd", response_model=PRDResponse)
def generate_prd(request: PRDRequest):
    try:
        idea = request.idea.strip()

        # Ask Gemini to generate the PRD.
        result = generate_prd_content(idea)

        # Validate the AI-generated data.
        prd = PRDResponse.model_validate(result)

        # Convert the validated PRD to JSON text for SQLite.
        prd_json = json.dumps(prd.model_dump())

        # Save the idea and PRD. Capture the database ID.
        prd_id = save_prd(idea, prd_json)

        # Return the PRD along with its database ID.
        return {
            **prd.model_dump(),
            "id": prd_id,
        }

    except RuntimeError as error:
        message = str(error)

        if "GEMINI_API_KEY is missing" in message:
            raise HTTPException(
                status_code=500,
                detail=message,
            ) from error

        raise HTTPException(
            status_code=502,
            detail="The AI provider could not generate a response.",
        ) from error

    except (ValueError, ValidationError) as error:
        raise HTTPException(
            status_code=502,
            detail="The AI provider returned an invalid PRD.",
        ) from error

    except Exception as error:
        print(f"Unexpected PRD generation error: {error}")

        raise HTTPException(
            status_code=502,
            detail="PRD generation failed. Check the backend terminal.",
        ) from error
@app.get("/api/prds")
def list_saved_prds():
    rows = get_all_prds()

    return [
        {
            "id": row["id"],
            "idea": row["idea"],
            "prd": json.loads(row["prd_json"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]
@app.post("/api/rice")
def prioritize_features(request: RiceRequest):
    return {
        "results": rank_features(request.features)
    }