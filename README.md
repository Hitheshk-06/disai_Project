# SBOM Shield

A full-stack Software Bill of Materials (SBOM) security platform for vulnerability detection, CVE tracking, and risk analytics.

## Features

- JWT authentication with register/login
- Dashboard with live risk metrics, charts, and CVE activity
- Applications management with Add/Delete and risk scoring
- Application Detail page with component-level CVE matching
- CVE Explorer with real-time search, filters, and pagination
- SBOM Manager — upload CycloneDX JSON or CSV files, auto-matches CVEs
- Vulnerability Graph — interactive D3.js force-directed visualization
- Risk Analytics — scorecard, heatmap, trend charts
- Settings — profile, password, API keys, integrations, NVD sync
- Rate limiting and input validation on all API endpoints

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts, D3.js
- Backend: Node.js, Express, SQLite (node:sqlite — zero native deps)
- Auth: JWT + bcryptjs

## Quick Start

### Local Development

**Backend**
```bash
cd backend
npm install
node --no-warnings src/index.js
# API runs on http://localhost:3001
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# UI runs on http://localhost:5173
```

**Default login:** `admin@company.com` / `password123`

### Docker (Production)

```bash
docker-compose up --build
# UI: http://localhost
# API: http://localhost:3001
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/applications | List applications |
| GET | /api/applications/:id/detail | App detail + CVE matches |
| POST | /api/applications | Create application |
| DELETE | /api/applications/:id | Delete application |
| GET | /api/cves | List CVEs (search, filter, paginate) |
| POST | /api/sbom/upload | Upload SBOM file |
| POST | /api/sbom/scan/:appName | Re-scan app components |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/graph | Vulnerability graph data |
| POST | /api/nvd/sync | Sync CVEs from NVD API 2.0 |

## SBOM Upload Formats

**CycloneDX JSON**
```json
{
  "components": [
    { "name": "log4j", "version": "2.14.1", "publisher": "Apache" }
  ]
}
```

**CSV** (name, version, vendor)
```csv
name,version,vendor
log4j,2.14.1,Apache
spring-core,5.3.0,VMware
```

## Environment Variables

**Backend** (`backend/.env`)
```
PORT=3001
JWT_SECRET=your-secret-key
```

**Frontend** (`frontend/.env`)
```
VITE_API_URL=http://localhost:3001/api
```
