FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app:/app/backend
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
COPY backend/requirements*.txt backend/
COPY ml/requirements-runtime.txt ml/
RUN if [ "$(uname -m)" = "x86_64" ]; then pip install --no-cache-dir torch==2.6.0 torchvision==0.21.0 --index-url https://download.pytorch.org/whl/cpu; fi
RUN pip install --no-cache-dir -r backend/requirements.txt -r backend/requirements-test.txt -r ml/requirements-runtime.txt
COPY backend backend
COPY ml/ensemble ml/ensemble
COPY ml/features ml/features
COPY ml/datasets ml/datasets
COPY ml/risk ml/risk
COPY ml/__init__.py ml/__init__.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
