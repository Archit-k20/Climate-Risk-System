# 🛰️ Climate Risk Intelligence Dashboard

A production-quality full-stack AI platform that analyzes satellite imagery to assess climate risk using an ensemble of deep learning and machine learning models, with a real-time React dashboard for visualization and reporting.

![Dashboard Preview](docs/dashboard-preview.png)

**[Live Demo](https://climate-risk-intelligence.vercel.app)** · **[Backend API Docs](http://localhost:8000/docs)**

---

## Overview

Climate Risk Intelligence processes satellite imagery through a three-model ensemble (Vision Transformer, ResNet-18, XGBoost) trained on the EuroSAT dataset to classify land cover types and map them to climate risk assessments. Results are delivered through a real-time dashboard with WebSocket updates, interactive geospatial maps, and LLM-generated mitigation reports.

---

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│         Vite · TypeScript · Tailwind · Framer Motion        │
│    Dashboard · Upload · Risk Map · Simulator · Reports      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP + WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                   FastAPI Backend                           │
│              REST API · Socket.io · CORS                    │
└──────┬──────────────┬──────────────────────┬────────────────┘
       │              │                      │
┌──────▼──────┐ ┌─────▼──────┐  ┌───────────▼───────────────┐
│  PostgreSQL  │ │   Redis    │  │      Celery Worker         │
│  + pgvector  │ │  (broker)  │  │  ML Pipeline · LLM Agent  │
└─────────────┘ └────────────┘  └───────────────────────────┘
                                          │
                          ┌───────────────▼───────────────┐
                          │      ML Ensemble Pipeline      │
                          │  ViT · ResNet-18 · XGBoost     │
                          │  EuroSAT (10 classes, 27k img) │
                          └───────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework with full type safety |
| Vite 5 | Build tool and dev server |
| Tailwind CSS v4 | Utility-first styling with CSS custom properties |
| Framer Motion | Page transitions and micro-animations |
| Recharts | KPI sparklines and risk distribution charts |
| React-Leaflet | Interactive geospatial risk map |
| Zustand | Global state management |
| TanStack Query | Server state, caching, and background refetching |
| Socket.io-client | Real-time WebSocket updates |
| jsPDF + html2canvas | PDF report generation |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async REST API with automatic OpenAPI docs |
| SQLAlchemy + PostgreSQL | Relational data persistence |
| pgvector | Vector similarity search for image embeddings |
| Redis + Celery | Async task queue for ML pipeline execution |
| Socket.io (python) | Real-time event broadcasting |
| LangChain + OpenAI | LLM-generated mitigation reports |

### Machine Learning
| Technology | Purpose |
|---|---|
| PyTorch + HuggingFace | ViT-Base-Patch16 image classification |
| torchvision | ResNet-18 fine-tuning |
| XGBoost | Gradient boosting on hand-crafted features |
| SHAP | Model explainability and feature importance |
| scikit-image | GLCM texture feature extraction |
| EuroSAT | 27,000 Sentinel-2 satellite images, 10 classes |

---

## Features

### Core Pipeline
- **Ensemble ML Classifier** — Three-model voting system (ViT + ResNet-18 + XGBoost) trained on EuroSAT satellite imagery achieving robust land cover classification across 10 categories
- **Real-time Processing** — Async Celery task queue processes images in the background with live progress updates via WebSocket
- **LLM Mitigation Reports** — OpenAI GPT-3.5 generates structured three-section mitigation reports for each detected risk zone
- **Vector Similarity Search** — pgvector enables finding visually similar satellite images from the database

### Dashboard
- **Live KPI Cards** — Total analyzed, high risk zones, average risk score, and reports generated with animated counters and 7-day sparklines
- **Risk Distribution Chart** — Real-time donut chart showing Low/Medium/High risk breakdown from database, with graceful mock data fallback when backend is offline
- **Recent Analyses Feed** — Live activity feed populated from WebSocket events and database history
- **System Status Bar** — Real-time health monitoring of FastAPI, PostgreSQL, Redis, and ML Model services

### Upload & Analysis
- **Drag-and-drop Interface** — Supports JPG, PNG, TIFF satellite imagery up to 50MB
- **Pipeline Stepper** — Five-stage progress indicator (Upload → Preprocess → AI Analysis → Report → Complete)
- **Risk Score Gauge** — Custom SVG semicircle gauge with animated needle sweep
- **Risk Type Breakdown** — Staggered animated bars for five risk categories with confidence scores

### Geospatial Risk Map
- **Interactive Leaflet Map** — CartoDB dark tile layer with custom SVG risk markers
- **Heatmap Overlay** — Risk intensity gradient using leaflet.heat plugin
- **Pulsing High-Risk Markers** — Animated SVG rings for high-risk zones
- **Filter Panel** — Real-time filtering by risk level and risk type

### Climate Simulator
- **Parameter Controls** — Rainfall, temperature delta, humidity, soil moisture, and crop type sliders
- **Yield Projection Chart** — Baseline vs projected crop yield over 12 months with Recharts
- **Risk Impact Matrix** — 3×3 grid showing Drought/Flood/Wildfire probability under current parameters
- **AI Insight Card** — Typewriter-animated plain-language interpretation with 300ms debouncing

### Reports Archive
- **Sortable Data Table** — Search, filter by risk level, sort by any column
- **PDF Export Engine** — html2canvas + jsPDF generates professional multi-page reports with cover page
- **Report Detail Sheet** — Slide-in panel with full risk analysis and mitigation plan

### Settings & Polish
- **Dark/Light Theme** — CSS custom property system enables instant full-app theme switching
- **Notification Preferences** — Granular control over High/Medium/Low risk alert behavior wired to WebSocket event handlers
- **Loading Skeletons** — Shimmer placeholders for every data-fetching component
- **Error Boundaries** — Graceful fallback UI for component-level errors
- **Empty States** — Designed empty states for all lists and tables

---

## Local Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker Desktop

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/climate-risk-intelligence.git
cd climate-risk-intelligence
```

### 2. Start Infrastructure
```bash
docker compose up -d
```

This starts PostgreSQL with pgvector on port 5433. Redis is expected to be running separately on port 6379.

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://climate_user:climate_pass@localhost:5433/climate_ai
OPENAI_API_KEY=your_openai_api_key_here
```

Initialize the database:
```bash
python -m app.db.init_db
```

### 4. Download ML Models
The trained model weights are not included in this repository due to file size. Train them using:
```bash
# From the project root with venv activated
python ml/training/train_vit.py
python ml/training/train_resnet.py
python ml/training/train_xgboost.py
```

Or download pre-trained weights from [Releases](https://github.com/YOUR_USERNAME/climate-risk-intelligence/releases).

### 5. Start All Services

**Terminal 1 — Celery Worker:**
```bash
cd backend
venv\Scripts\activate  # Windows
celery -A app.core.celery_app worker --loglevel=info -P eventlet
```

**Terminal 2 — FastAPI Server:**
```bash
cd backend
venv\Scripts\activate  # Windows
uvicorn app.main:app --reload
```

**Terminal 3 — React Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Dataset

This project uses the **EuroSAT** dataset — 27,000 geo-referenced Sentinel-2 satellite images covering 10 land cover classes across Europe.

| Class | Risk Level | Risk Type |
|---|---|---|
| Forest | Low | Carbon Sink |
| SeaLake | Medium | Flood Risk |
| River | High | Flood Risk |
| Industrial | High | Pollution Risk |
| Highway | Medium | Heat Island |
| Residential | Medium | Urban Expansion |
| AnnualCrop | Medium | Drought Vulnerability |
| PermanentCrop | Medium | Crop Disease Risk |
| Pasture | Low | Soil Degradation |
| HerbaceousVegetation | Medium | Wildfire Risk |

---

## API Documentation

With the backend running, full interactive API documentation is available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health check |
| `POST` | `/api/v1/images/upload` | Upload satellite image |
| `POST` | `/api/v1/images/{id}/analyze-async` | Dispatch ML analysis task |
| `GET` | `/api/v1/images/tasks/{task_id}` | Poll task completion status |
| `GET` | `/api/v1/images/stats/summary` | Dashboard KPI aggregates |
| `GET` | `/api/v1/images/stats/distribution` | Risk level distribution |
| `GET` | `/api/v1/images/reports/full` | Images joined with risk results |

---

## Project Structure
```
climate-risk-intelligence/
├── frontend/                    # React + TypeScript dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/       # KPI cards, activity feed, charts
│   │   │   ├── upload/          # Dropzone, stepper, gauge, results
│   │   │   ├── map/             # Leaflet markers, heatmap, filters
│   │   │   ├── simulator/       # Parameter sliders, yield chart
│   │   │   ├── reports/         # Data table, detail sheet
│   │   │   ├── layout/          # Navbar, sidebar, app shell
│   │   │   └── ui/              # Skeletons, error boundary, empty states
│   │   ├── hooks/               # Data fetching and business logic
│   │   ├── pages/               # Route-level page components
│   │   ├── providers/           # WebSocket context provider
│   │   ├── store/               # Zustand global state
│   │   ├── lib/                 # API client, adapters, simulation engine
│   │   └── types/               # TypeScript interfaces
│   └── vercel.json              # Vercel deployment configuration
│
├── backend/                     # FastAPI + Python backend
│   ├── app/
│   │   ├── api/v1/              # REST endpoint routers
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic and Celery tasks
│   │   ├── db/                  # Database session and initialization
│   │   └── core/                # Config, logging, Celery app
│   └── requirements.txt
│
├── ml/                          # Machine learning pipeline
│   ├── datasets/                # EuroSAT data loaders
│   ├── ensemble/                # Three-model voting classifier
│   ├── features/                # GLCM texture feature extraction
│   ├── risk/                    # Risk mapper and assessment engine
│   ├── explainability/          # SHAP analysis and ViT saliency maps
│   └── models/                  # Trained model weights (gitignored)
│
└── docker-compose.yml           # PostgreSQL + Redis infrastructure
```

---

## Key Design Decisions

**Why an ensemble of three models?** A single model's prediction can be overconfident on edge cases. The majority-voting ensemble (ViT + ResNet-18 + XGBoost) combines the global attention patterns of transformers, the convolutional spatial features of ResNet, and the hand-crafted statistical features of XGBoost. When all three agree, confidence is high. When they disagree, the majority vote provides robustness.

**Why async Celery tasks for ML inference?** ViT inference on CPU takes 10-20 seconds. Blocking the HTTP request thread for that duration would make the API unresponsive to other requests. Celery dispatches the inference to a separate worker process, the API returns immediately with a task ID, and the frontend polls for completion — a pattern used in production ML systems at scale.

**Why CSS custom properties for theming?** Every color in the application uses `var(--color-*)` tokens rather than hardcoded hex values. This means the entire theme switches instantly by changing a single `data-theme` attribute on the HTML element — no component code changes needed. It also makes the design system self-documenting and easy to extend.

**Why Zustand over Redux?** The application state has moderate complexity — notifications, live activity entries, map filters, WebSocket connection status. Zustand provides this with zero boilerplate and direct `getState()` access from outside React components (critical for the Celery task's WebSocket emission pattern), which Redux would require significant additional setup to achieve.

---

## Roadmap

- [ ] User authentication with JWT tokens
- [ ] Cloud deployment (AWS EC2 / DigitalOcean)
- [ ] Geographic coordinate capture on image upload
- [ ] SHAP explainability visualization in Upload results panel
- [ ] Global command palette search (⌘K)
- [ ] Mobile-responsive sidebar with bottom sheet navigation
- [ ] Alembic database migrations for schema versioning
- [ ] Model confidence scores per classifier in report detail

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [EuroSAT Dataset](https://github.com/phelber/EuroSAT) — Helber et al., 2019
- [HuggingFace Transformers](https://huggingface.co/google/vit-base-patch16-224) — ViT-Base-Patch16-224
- [Sentinel-2](https://sentinel.esa.int/web/sentinel/missions/sentinel-2) — European Space Agency
