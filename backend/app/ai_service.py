import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load the secret key from backend/.env.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)


def generate_prd_content(idea: str) -> dict:
    """Generate a structured product requirements document using Gemini."""

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Check your backend/.env file."
        )

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are an experienced product manager helping a software team.

Create a practical, specific Product Requirements Document (PRD)
from the user's product idea.

PRODUCT IDEA:
{idea}

Return a JSON object with exactly these fields:
- title: string
- problem_statement: string
- target_users: array of strings
- goals: array of strings
- features: array of strings
- user_stories: array of strings
- assumptions: array of strings

Requirements:
1. Make every field specific to the user's idea.
2. Include 3 to 5 useful MVP features.
3. Write user stories in the format:
   "As a [user], I want [capability] so that [benefit]."
4. Keep goals measurable where practical.
5. State uncertain details as assumptions, not facts.
6. Do not add fields outside the requested schema.
7. Return valid JSON, without Markdown fences.
"""

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.3,
        ),
    )

    if not response.text:
        raise RuntimeError("The AI provider returned an empty response.")

    # Convert the JSON text returned by Gemini into a Python dictionary.
    return json.loads(response.text)