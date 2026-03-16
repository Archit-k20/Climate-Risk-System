from app.db.session import engine
from app.db.base import Base
from app.models.image import Image
from app.models.risk import RiskScore

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
