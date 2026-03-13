#!/usr/bin/env python3
"""
Seed initial data for Ithras placement portal
Creates sample users, companies, institutions, and cycles
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.modules.shared.database import SessionLocal, engine
# Import all models so they're registered with Base.metadata
from app import models  # This ensures all models are imported
from app.modules.shared.models import Base, User, Company, Institution, Cycle, JobPosting, Shortlist
import datetime

def seed_institutions(db: Session):
    """Seed institutions"""
    institutions = [
        {'id': 'inst1', 'name': 'IIM Calcutta', 'tier': 'Tier 1', 'location': 'Kolkata'},
        {'id': 'inst2', 'name': 'IIM Ahmedabad', 'tier': 'Tier 1', 'location': 'Ahmedabad'},
        {'id': 'lateral', 'name': 'Lateral Hiring', 'tier': 'Lateral', 'location': 'Global'}
    ]
    
    for inst_data in institutions:
        existing = db.query(Institution).filter(Institution.id == inst_data['id']).first()
        if not existing:
            institution = Institution(**inst_data)
            db.add(institution)
            print(f"Created institution: {inst_data['name']}")

def seed_users(db: Session):
    """Seed users - only system admin (founders@ithras.com)."""
    users_data = [
        {
            'id': 'user_founders',
            'email': 'founders@ithras.com',
            'name': 'Founders',
            'role': 'SYSTEM_ADMIN',
            'institution_id': None
        },
    ]
    
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data['email']).first()
        if not existing:
            user = User(**user_data)
            db.add(user)
            print(f"Created user: {user_data['name']} ({user_data['role']})")
        else:
            print(f"User {user_data['email']} already exists, skipping")

def seed_companies(db: Session):
    """Seed companies"""
    companies_data = [
        {'id': 'comp1', 'name': 'McKinsey & Company', 'last_year_hires': 15, 'cumulative_hires_3y': 45, 'last_year_median_fixed': 28.5},
        {'id': 'comp2', 'name': 'BCG', 'last_year_hires': 12, 'cumulative_hires_3y': 38, 'last_year_median_fixed': 27.0},
        {'id': 'comp3', 'name': 'Bain & Company', 'last_year_hires': 10, 'cumulative_hires_3y': 32, 'last_year_median_fixed': 26.5},
        {'id': 'comp4', 'name': 'Goldman Sachs', 'last_year_hires': 8, 'cumulative_hires_3y': 25, 'last_year_median_fixed': 32.0},
        {'id': 'comp5', 'name': 'Amazon', 'last_year_hires': 20, 'cumulative_hires_3y': 60, 'last_year_median_fixed': 24.0}
    ]
    
    for comp_data in companies_data:
        existing = db.query(Company).filter(Company.id == comp_data['id']).first()
        if not existing:
            company = Company(**comp_data)
            db.add(company)
            print(f"Created company: {comp_data['name']}")

def seed_cycles(db: Session):
    """Seed placement cycles"""
    cycles_data = [
        {
            'id': 'cycle1',
            'name': '2025-26 Final Placements',
            'type': 'FINAL',
            'category': 'CURRENT',
            'status': 'APPLICATIONS_OPEN',
            'start_date': datetime.datetime(2025, 8, 1),
            'end_date': datetime.datetime(2025, 12, 31)
        },
        {
            'id': 'cycle2',
            'name': '2024-25 Final Placements',
            'type': 'FINAL',
            'category': 'HISTORICAL',
            'status': 'CLOSED',
            'start_date': datetime.datetime(2024, 8, 1),
            'end_date': datetime.datetime(2024, 12, 31)
        }
    ]
    
    for cycle_data in cycles_data:
        existing = db.query(Cycle).filter(Cycle.id == cycle_data['id']).first()
        if not existing:
            cycle = Cycle(**cycle_data)
            db.add(cycle)
            print(f"Created cycle: {cycle_data['name']}")

def main():
    """Main seeding function"""
    print("=" * 60)
    print("Seeding Ithras Database")
    print("=" * 60)
    
    # Create tables if they don't exist
    print("\n0. Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ All tables created/verified")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    db = SessionLocal()
    try:
        print("\n1. Seeding institutions...")
        seed_institutions(db)
        db.commit()
        
        print("\n2. Seeding users...")
        seed_users(db)
        db.commit()
        
        print("\n3. Seeding companies...")
        seed_companies(db)
        db.commit()
        
        print("\n4. Seeding cycles...")
        seed_cycles(db)
        db.commit()
        
        print("\n" + "=" * 60)
        print("✓ Database seeding completed successfully!")
        print("=" * 60)
        print("\nSample user created:")
        print("  System Admin: founders@ithras.com")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == '__main__':
    main()
