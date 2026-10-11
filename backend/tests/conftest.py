import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.image import Image
from app.models.risk import RiskScore
from app.models.analysis import Analysis
from app.main import fastapi_app
from app.db.session import get_db
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def test_engine():
    url = os.environ.get("TEST_DATABASE_URL", "")
    if not url.endswith("/climate_test"):
        pytest.skip("Use the dedicated climate_test database to run integration tests")
    engine = create_engine(url)
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(test_engine):
    # Roll back every test transaction; never touch the app's database.
    conn = test_engine.connect()
    transaction = conn.begin()
    session = sessionmaker(bind=conn, join_transaction_mode="create_savepoint")()
    yield session
    session.close()
    transaction.rollback()
    conn.close()


@pytest.fixture
def client(db, tmp_path, monkeypatch):
    from app.services import image_service

    monkeypatch.setattr(image_service, "UPLOAD_DIR", tmp_path)
    fastapi_app.dependency_overrides[get_db] = lambda: db
    with TestClient(fastapi_app) as client:
        yield client
    fastapi_app.dependency_overrides.clear()
