# ClimateRisk Observatory

A React interface for an existing satellite land-cover and climate-risk demonstration. The six screens are Overview, Upload & Analyze, Risk Map, Simulator, Reports and Settings. The paper-and-green observatory theme has a coordinated dark option and mobile navigation.

## Modes and limitations

- **Demo (default / Vercel):** deterministic sample records, no API or Socket.IO requests. Image selection is a local preview; no image is claimed to have been analysed. Map tiles are still fetched from OpenStreetMap.
- **Connected:** uses the configured Python API. Empty, error, failed and inconclusive states remain explicit; there is no sample-data fallback.
- The map uses fixed illustrative locations. The simulator retains its original unvalidated local formulas and authored baselines.
- The classification-to-risk mapping is a heuristic index, not calibrated confidence or an event probability. Real inference requires verified artifacts; see [model compatibility](docs/model-artifacts.md).

## Frontend

Use **Node 24**.

```sh
cd frontend
npm ci
npm run dev
```

The default mode is demo. For the local backend, create `frontend/.env.local`:

```dotenv
VITE_APP_MODE=connected
VITE_API_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

Restart Vite after changing environment variables. Only public URLs and the mode belong in `VITE_` variables; never put Gemini or database credentials there.

```sh
npm run build
npm run lint
npm test
```

## Local backend

Docker Compose supplies Python 3.11, PostgreSQL/pgvector, Redis, the API, Celery worker and shared upload storage. Bindings are loopback-only. These development database credentials are for local use; no public backend is provisioned.

```sh
docker compose up --build -d
```

The additive migration runs before the API/worker. Existing `images` and `risk_scores` rows are retained. The new `analyses` table stores one canonical record per image. Completed reports retain their exact narrative and provenance; old records with missing information remain labelled incomplete. The last historical risk row per image is displayed without deleting older rows. Legacy scores are excluded from new-analysis dashboard metrics because their origin cannot be verified.

API: `http://localhost:8000/api/v1/health` and OpenAPI docs at `http://localhost:8000/docs`. If port 8000 is occupied, use `API_PORT=18080 docker compose up --build -d` and update both frontend URLs accordingly. Database and Redis ports can be changed in your local Compose override if needed.

`GEMINI_API_KEY` and `GEMINI_MODEL` in the repository-root `.env` optionally enable narrative generation. Choose a model available to your account. Without them (or on provider failure), the original structured template is saved with an accurate source/reason. Do not commit `.env`.

Model binaries are mounted read-only from `ml/models`. Without verified training metadata, the API remains usable but analysis fails honestly. The health response reports actual API/database/Redis/model readiness; socket disconnection does not prevent polling.

### API contract

Existing upload, sync analysis, async analysis, task-status, archive and statistic routes remain under `/api/v1/images`. Uploads accept JPEG/PNG content up to **5 MiB**, inclusive. Successful uploads expose an ID and filename, not an internal filesystem path.

Analysis status is `queued`, `running`, `completed`, `inconclusive` or `failed`. Sync/async results, archive records and `analysis_complete` socket events share the canonical response schema in OpenAPI. Optional data is null, never an inferred low-risk result. Scores, votes, timestamps, narrative, source, and failure reasons are persisted. Completion events are emitted through Redis only after the database commit. Worker retries/repeated submissions reuse a record; completed reports are not regenerated. Expired processing attempts can be retried, and stale workers cannot overwrite a retry.

### Tests

Tests use a separate disposable `climate_test` database, never the app database:

```sh
docker compose exec -T postgres createdb -U climate_user climate_test
docker compose --profile test run --rm test
```

Skip the `createdb` command if that database already exists. Tests roll back their transactions. The suite covers upload formats/size limits, persistence failure, idempotency, legacy preservation, deterministic voting, shared preprocessing and explicit model unavailability. Successful workflow tests use a stub predictor; they do not establish accuracy of the archived checkpoints.

Stop local services without deleting data using `docker compose down`.

## Vercel previews

Keep the existing Vercel project/domain. Recommended project root: `frontend`, Node 24, install `npm ci`, output `dist`. `frontend/vercel.json` explicitly builds demo mode and rewrites the five non-root application routes to `index.html`. API and asset paths are not rewritten. A root `vercel.json` provides equivalent settings if the project is rooted at the repository instead.

Push a review branch and open a pull request to obtain the existing GitHub integration's Vercel preview. Verify direct links/reloads for all six pages before merging. Production is not promoted by this change until the branch is merged or deliberately deployed.

### Basemap configuration

The previous CARTO endpoint now returns API-key-required tiles. The default basemap uses the standard OpenStreetMap tile service with visible attribution and normal browser caching/referrers. Follow its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/); no offline download or bulk prefetch is implemented. `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION` can configure another authorized provider if required. Dark mode adjusts only the basemap presentation.
