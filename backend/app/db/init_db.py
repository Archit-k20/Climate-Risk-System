"""Compatibility entrypoint for the additive Alembic migration."""

from pathlib import Path
from alembic.config import Config
from alembic import command


def init_db():
    command.upgrade(
        Config(str(Path(__file__).resolve().parents[2] / "alembic.ini")), "head"
    )


if __name__ == "__main__":
    init_db()
