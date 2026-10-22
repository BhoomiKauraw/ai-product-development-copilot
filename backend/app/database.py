import sqlite3
from pathlib import Path

# Store the database in the backend folder.
DATABASE_PATH = Path(__file__).resolve().parents[1] / "copilot.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS prds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idea TEXT NOT NULL,
                prd_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def save_prd(idea: str, prd_json: str) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO prds (idea, prd_json)
            VALUES (?, ?)
            """,
            (idea, prd_json),
        )
        return cursor.lastrowid


def get_all_prds():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, idea, prd_json, created_at
            FROM prds
            ORDER BY id DESC
            """
        ).fetchall()

        return [dict(row) for row in rows]