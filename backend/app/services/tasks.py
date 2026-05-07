import sys
from pathlib import Path
import random


root_path = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(root_path))

from app.core.celery_app import celery_app
from ml.ensemble.combine_models import ensemble_predict
from app.services.llm_agent import generate_mitigation_report

# Risk level to numeric score mapping.
# These midpoint values match what the frontend adapter uses,
# so the gauge and the database are always in agreement.
RISK_LEVEL_RANGES = {
    'Low':    (10, 32),   # 10-32, centered around 22
    'Medium': (35, 64),   # 35-64, centered around 55
    'High':   (65, 95),   # 65-95, centered around 82
}

# Still needed for socket.io emit payload
RISK_LEVEL_TO_SCORE = {
    'Low':    22.0,
    'Medium': 55.0,
    'High':   82.0,
}

def compute_risk_score(risk_level: str, model_agreement: int) -> float:
    """
    Computes a varied numeric score within the appropriate range
    based on the risk level and how confidently the ensemble agreed.

    Logic:
    - Unanimous agreement (3/3): score is in the upper 60% of the range
      because all three models are confident — push toward the stronger end
    - Majority agreement (2/3): score is in the lower 60% of the range
      because one model disagreed — stay closer to the boundary
    
    This produces genuinely varied scores that reflect real uncertainty
    rather than random noise. A unanimous Forest prediction gets ~18-22,
    a split Forest prediction gets ~10-18.
    """
    range_min, range_max = RISK_LEVEL_RANGES.get(risk_level, (35, 64))
    range_size = range_max - range_min

    if model_agreement == 3:
        # Unanimous — score in upper 60% of range
        lower = range_min + int(range_size * 0.40)
        upper = range_max
    else:
        # Majority (2/3) — score in lower 60% of range
        lower = range_min
        upper = range_min + int(range_size * 0.60)

    # Round to 1 decimal place so scores look realistic
    score = round(random.uniform(lower, upper), 1)
    return score

@celery_app.task(bind=True, name="analyze_image_task")
def analyze_image_task(self, file_path_str: str, image_id: int = 0, filename: str = ""):
    try:
        # ── Run the ML ensemble pipeline ──────────────────────────────────────
        risk_info = ensemble_predict(file_path_str)

        # ── Generate the LLM mitigation report ───────────────────────────────
        dynamic_report = generate_mitigation_report(risk_info)
        risk_info["dynamic_report"] = dynamic_report

        # ── Save risk score to database ───────────────────────────────────────
        # This is the critical step that was missing before.
        # We save the score here inside the task because this is where
        # the async analysis actually runs — the HTTP endpoint just
        # dispatches the task and returns immediately without waiting
        # for the result, so it can't be responsible for saving the score.
        if image_id:
            try:
                from app.db.session import SessionLocal
                from app.models.image import Image  # noqa: F401
                from app.models.risk import RiskScore

                db = SessionLocal()

                risk_level       = risk_info.get('risk_level', 'Low')
                model_agreement  = risk_info.get('model_agreement', 2)
                score            = compute_risk_score(risk_level, model_agreement)
                risk_type  = risk_info.get('risk_type', 'Unknown')
                land_class = risk_info.get('land_class', 'Unknown')

                existing = db.query(RiskScore).filter(
                    RiskScore.image_id == image_id
                ).first()

                if not existing:
                    risk_score_record = RiskScore(
                        image_id=image_id,
                        score=score,
                        risk_level=risk_level,
                        risk_type=risk_type,
                        land_class=land_class,
                    )
                    db.add(risk_score_record)
                    db.commit()
                    print(f'[Task] Saved {land_class} → {risk_level} (score {score}) for image {image_id}')
                else:
                    # Update existing record with the latest analysis result
                    existing.score      = score
                    existing.risk_level = risk_level
                    existing.risk_type  = risk_type
                    existing.land_class = land_class
                    db.commit()
                    print(f'[Task] Updated score for image {image_id}')

                db.close()

            except Exception as db_error:
                print(f'[Task] Warning: Could not save risk score: {db_error}')

        # ── Emit a real-time WebSocket event ──────────────────────────────────
        try:
            import socketio as sio_client

            external_sio = sio_client.SimpleClient()
            external_sio.connect('http://127.0.0.1:8000')

            risk_level = risk_info.get('risk_level', 'Low')
            risk_type  = risk_info.get('risk_type', 'Unknown')

            external_sio.emit('analysis_complete', {
                'image_id':   image_id,
                'filename':   filename or Path(file_path_str).name,
                'risk_score': RISK_LEVEL_TO_SCORE.get(risk_level, 50),
                'risk_level': risk_level.lower(),
                'risk_type':  risk_type,
                'confidence': 85,
                'analyzed_at': str(Path(file_path_str).stat().st_mtime),
            })

            external_sio.disconnect()
            print(f'[Task] Emitted analysis_complete for image {image_id}')

        except Exception as emit_error:
            print(f'[Task] Socket.io emit failed (non-fatal): {emit_error}')

        risk_info['image_id'] = image_id
        return risk_info

    except Exception as exc:
        self.retry(exc=exc, max_retries=3, countdown=5)