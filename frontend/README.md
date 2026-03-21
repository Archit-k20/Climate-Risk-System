# ClimateRisk Intelligence Dashboard

A production-quality full-stack climate risk analysis platform combining satellite imagery processing, ensemble machine learning, and real-time WebSocket updates.

## Architecture Overview

The system has three layers working together. The **ML Pipeline** uses an ensemble of ViT (Vision Transformer), ResNet-18, and XGBoost models trained on the EuroSAT dataset to classify satellite images into 10 land cover categories and map each to a climate risk assessment. The **FastAPI Backend** exposes REST endpoints for image upload, analysis, and retrieval, backed by PostgreSQL with pgvector for similarity search and Redis for async task queuing via Celery. The **React Frontend** is a real-time dashboard built with Vite, TypeScript, Framer Motion, and Recharts that displays live analysis results via WebSocket connections.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS v4, Framer Motion, Recharts, React-Leaflet, Zustand, TanStack Query, Socket.io-client

**Backend:** FastAPI, SQLAlchemy, PostgreSQL + pgvector, Redis, Celery, LangChain + OpenAI

**ML:** PyTorch, HuggingFace Transformers (ViT), XGBoost, SHAP explainability, GLCM texture features

## Getting Started

Start the backend services using Docker, then run the FastAPI server and the React development server as described in the backend README. The frontend proxies all `/api` requests to `localhost:8000` automatically via Vite's proxy configuration.

## Key Features

The dashboard provides real-time satellite image analysis with an ensemble ML classifier, an interactive geospatial risk map with heatmap overlays, a what-if climate simulator with crop yield projections, PDF report export, and live WebSocket updates when new analyses complete.