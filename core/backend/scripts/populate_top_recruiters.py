"""
Script to populate top 100 recruiters in Indian B-Schools using Gemini Vertex API
"""
import sys
import os
import json
import uuid
import asyncio
import aiohttp
from typing import List, Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.modules.shared.database import SessionLocal
from app.modules.shared.models import Company
from google import genai
from google.genai.types import HttpOptions
from google.oauth2.credentials import Credentials
from app.config import settings

GEMINI_BASE_URL = settings.GEMINI_BASE_URL or "https://vertexai.prod.ai-gateway.quantumblack.com/811492d9-b28d-490a-abab-b0433c4dc629/"
GEMINI_ACCESS_TOKEN = settings.GEMINI_ACCESS_TOKEN
GEMINI_PROJECT = settings.GEMINI_PROJECT or "aigateway"
GEMINI_LOCATION = settings.GEMINI_LOCATION or "global"
GEMINI_MODEL = settings.GEMINI_MODEL

def get_gemini_client():
    """Initialize Gemini client"""
    if not GEMINI_ACCESS_TOKEN:
        raise ValueError("GEMINI_ACCESS_TOKEN environment variable is required")
    
    credentials = Credentials(GEMINI_ACCESS_TOKEN)
    return genai.Client(
        http_options=HttpOptions(
            api_version="v1",
            base_url=GEMINI_BASE_URL,
        ),
        vertexai=True,
        project=GEMINI_PROJECT,
        location=GEMINI_LOCATION,
        credentials=credentials,
    )

def fetch_top_recruiters(client: genai.Client) -> List[Dict[str, Any]]:
    """
    Use Gemini API to get top 100 recruiters in Indian B-Schools
    """
    prompt = """
    List the top 100 companies that actively recruit from Indian B-Schools (IIMs, ISB, XLRI, FMS, etc.).
    
    For each company, provide:
    1. Company name (official name)
    2. Domain/website (if known)
    3. Sector/Industry (e.g., Consulting, Finance, Technology, FMCG, etc.)
    4. Typical roles they hire for (e.g., Management Trainee, Consultant, Analyst, etc.)
    
    Return the data as a JSON array with this exact structure:
    [
        {
            "name": "Company Name",
            "domain": "company.com",
            "sector": "Sector Name",
            "typical_roles": ["Role 1", "Role 2"]
        },
        ...
    ]
    
    Include major recruiters like:
    - Consulting: McKinsey & Company, BCG, Bain & Company, Deloitte, PwC, EY, KPMG, Accenture Strategy
    - Finance: Goldman Sachs, JP Morgan, Morgan Stanley, Credit Suisse, Deutsche Bank, Citibank, HDFC Bank, ICICI Bank, Axis Bank
    - Technology: Google, Microsoft, Amazon, Apple, Meta, Adobe, Oracle, Salesforce, Flipkart, Paytm
    - FMCG: Hindustan Unilever, P&G, Nestle, ITC, Coca-Cola, PepsiCo, Marico, Dabur
    - E-commerce: Amazon, Flipkart, Myntra, Nykaa
    - Manufacturing: Tata Group companies, Reliance, Adani Group, Mahindra, Bajaj
    - And other major recruiters across various sectors
    
    Return ONLY valid JSON, no additional text.
    """
    
    try:
        print("🤖 Querying Gemini API for top 100 recruiters...")
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        
        # Extract text from response
        result_text = None
        if hasattr(response, 'text'):
            result_text = response.text
        elif hasattr(response, 'candidates') and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content'):
                if hasattr(candidate.content, 'parts') and len(candidate.content.parts) > 0:
                    result_text = candidate.content.parts[0].text
                elif hasattr(candidate.content, 'text'):
                    result_text = candidate.content.text
            elif hasattr(candidate, 'text'):
                result_text = candidate.text
        
        if not result_text:
            # Try to get string representation
            result_text = str(response)
            # If it's still not useful, try to extract from any available attribute
            if not result_text or len(result_text) < 10:
                try:
                    result_text = json.dumps(response.__dict__) if hasattr(response, '__dict__') else str(response)
                except:
                    result_text = str(response)
        
        # Clean up JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        companies = json.loads(result_text)
        print(f"✅ Retrieved {len(companies)} companies from Gemini")
        return companies
        
    except Exception as e:
        print(f"❌ Error fetching from Gemini: {e}")
        raise

async def fetch_logo_url(session: aiohttp.ClientSession, company_name: str, domain: str = None) -> str:
    """
    Fetch company logo URL using Clearbit Logo API with fallback to UI Avatars
    """
    # Try Clearbit first if domain is provided
    if domain:
        # Clean domain
        domain = domain.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
        clearbit_url = f"https://logo.clearbit.com/{domain}"
        
        try:
            async with session.get(clearbit_url, timeout=aiohttp.ClientTimeout(total=2)) as resp:
                if resp.status == 200:
                    # Check if it's actually an image (not a placeholder)
                    content_type = resp.headers.get('content-type', '')
                    if 'image' in content_type:
                        print(f"  ✓ Found Clearbit logo for {company_name}")
                        return clearbit_url
        except:
            pass
    
    # Fallback: Try common domain patterns
    if not domain:
        clean_name = company_name.lower().replace("&", "and").replace(",", "").replace(".", "")
        clean_name = "".join(c for c in clean_name if c.isalnum() or c == " ")
        clean_name = clean_name.replace(" ", "")
        
        common_domains = [
            f"{clean_name}.com",
            f"{clean_name}.in",
            f"{clean_name}.co.in",
            f"{clean_name}.io"
        ]
        
        for test_domain in common_domains:
            clearbit_url = f"https://logo.clearbit.com/{test_domain}"
            try:
                async with session.get(clearbit_url, timeout=aiohttp.ClientTimeout(total=2)) as resp:
                    if resp.status == 200:
                        content_type = resp.headers.get('content-type', '')
                        if 'image' in content_type:
                            print(f"  ✓ Found Clearbit logo for {company_name} via {test_domain}")
                            return clearbit_url
            except:
                continue
    
    # Final fallback: UI Avatars
    fallback_url = f"https://ui-avatars.com/api/?name={company_name.replace(' ', '+')}&size=128&background=random&bold=true"
    print(f"  ⚠ Using fallback avatar for {company_name}")
    return fallback_url

async def fetch_all_logos(companies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Fetch logos for all companies concurrently
    """
    async with aiohttp.ClientSession() as session:
        tasks = []
        for company in companies:
            task = fetch_logo_url(session, company.get('name', ''), company.get('domain'))
            tasks.append(task)
        
        logo_urls = await asyncio.gather(*tasks)
        
        # Add logo URLs to companies
        for i, company in enumerate(companies):
            company['logo_url'] = logo_urls[i]
        
        return companies

def populate_companies(companies: List[Dict[str, Any]], db: Session):
    """
    Populate companies into the database
    """
    created_count = 0
    updated_count = 0
    skipped_count = 0
    
    for company_data in companies:
        company_name = company_data.get('name', '').strip()
        if not company_name:
            skipped_count += 1
            continue
        
        # Check if company already exists
        existing = db.query(Company).filter(Company.name == company_name).first()
        
        if existing:
            # Update logo if it's better (Clearbit > UI Avatars)
            if company_data.get('logo_url'):
                if 'ui-avatars.com' not in existing.logo_url or 'ui-avatars.com' in company_data['logo_url']:
                    existing.logo_url = company_data['logo_url']
                    updated_count += 1
                    print(f"  ↻ Updated logo for {company_name}")
            else:
                skipped_count += 1
        else:
            # Create new company
            company_id = f"comp_{uuid.uuid4().hex[:12]}"
            new_company = Company(
                id=company_id,
                name=company_name,
                logo_url=company_data.get('logo_url'),
                last_year_hires=0,
                cumulative_hires_3y=0,
                last_year_median_fixed=None
            )
            db.add(new_company)
            created_count += 1
            print(f"  ✓ Created {company_name}")
    
    db.commit()
    return created_count, updated_count, skipped_count

def main():
    """Main execution function"""
    print("=" * 60)
    print("🚀 Populating Top 100 Recruiters in Indian B-Schools")
    print("=" * 60)
    
    try:
        # Initialize Gemini client
        client = get_gemini_client()
        
        # Fetch companies from Gemini
        companies = fetch_top_recruiters(client)
        
        if not companies:
            print("❌ No companies retrieved from Gemini")
            return
        
        # Fetch logos concurrently
        print(f"\n🖼️  Fetching logos for {len(companies)} companies...")
        companies_with_logos = asyncio.run(fetch_all_logos(companies))
        
        # Populate database
        print(f"\n💾 Populating database...")
        db = SessionLocal()
        try:
            created, updated, skipped = populate_companies(companies_with_logos, db)
            
            print("\n" + "=" * 60)
            print("✅ Population Complete!")
            print(f"   Created: {created} companies")
            print(f"   Updated: {updated} companies")
            print(f"   Skipped: {skipped} companies")
            print("=" * 60)
        finally:
            db.close()
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
