from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.analysis_service import execute_analysis


@celery_app.task(bind=True, name="analyze_image_task")
def analyze_image_task(self, analysis_id: str):
    with SessionLocal() as db:
        return execute_analysis(db, analysis_id, self.request.id)
