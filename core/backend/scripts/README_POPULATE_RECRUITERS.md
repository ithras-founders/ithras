# Populate Top 100 Recruiters Script

This script uses the Gemini Vertex API to fetch the top 100 recruiters in Indian B-Schools and populates them into the database with their correct logos.

## Prerequisites

1. Ensure `.env` file has the Gemini API credentials:
   ```
   GEMINI_BASE_URL=https://vertexai.prod.ai-gateway.quantumblack.com/811492d9-b28d-490a-abab-b0433c4dc629/
   GEMINI_ACCESS_TOKEN=your_access_token_here
   GEMINI_PROJECT=aigateway
   GEMINI_LOCATION=global
   GEMINI_MODEL=gemini-2.5-flash
   ```

2. Ensure database is running and migrations are applied.

## Usage

### Option 1: Run inside Docker container

```bash
docker-compose exec backend python scripts/populate_top_recruiters.py
```

### Option 2: Run locally (if Python environment is set up)

```bash
cd backend
python scripts/populate_top_recruiters.py
```

## What it does

1. **Queries Gemini API** to get top 100 companies that recruit from Indian B-Schools
2. **Fetches logos** for each company using:
   - Clearbit Logo API (primary) - uses company domain
   - UI Avatars (fallback) - generates avatar from company name
3. **Populates database** with:
   - Company name
   - Logo URL
   - Default values for hires and compensation (can be updated later)

## Output

The script will:
- Show progress as it fetches companies from Gemini
- Display logo fetching status for each company
- Report final statistics:
  - Created: New companies added
  - Updated: Existing companies with updated logos
  - Skipped: Companies that already exist with better logos

## Notes

- The script is idempotent - running it multiple times won't create duplicates
- Existing companies will only be updated if a better logo is found (Clearbit > UI Avatars)
- Company names are matched exactly, so ensure consistent naming
