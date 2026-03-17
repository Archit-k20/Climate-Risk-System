import sys
from pathlib import Path
import eventlet


eventlet.monkey_patch()


root_path = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(root_path))

from app.core.celery_app import celery_app
from ml.ensemble.combine_models import ensemble_predict
from app.services.llm_agent import generate_mitigation_report 

@celery_app.task(bind=True, name="analyze_image_task")
def analyze_image_task(self, file_path_str: str):
    try:
        
        risk_info = ensemble_predict(file_path_str)
        
        
        dynamic_report = generate_mitigation_report(risk_info)
        
       
        risk_info["dynamic_report"] = dynamic_report
        
        return risk_info
    except Exception as exc:
        
        self.retry(exc=exc, max_retries=3, countdown=5)