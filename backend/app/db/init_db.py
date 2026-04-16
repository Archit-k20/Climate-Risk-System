from app.db.session import engine
from app.db.base import Base
from app.models.image import Image
from app.models.risk import RiskScore
from sqlalchemy import text

def init_db():
    # Enable pgvector extension first — must exist before
    # creating the images table which uses the vector column type.
    # IF NOT EXISTS makes this safe to run multiple times.
    with engine.connect() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
        conn.commit()
    print('pgvector extension enabled')

    # Now create all tables
    Base.metadata.create_all(bind=engine)
    print('Tables created successfully')

if __name__ == "__main__":
    init_db()
    print('Database initialized successfully')