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
    """Seed users with various roles"""
    users_data = [
        # System Admin
        {
            'id': 'user_founders',
            'email': 'founders@ithras.com',
            'name': 'Founders',
            'role': 'SYSTEM_ADMIN',
            'institution_id': None
        },
        # Placement Team
        {
            'id': 'pt1',
            'email': 'placement@iimc.ac.in',
            'name': 'Placement Team Lead',
            'role': 'PLACEMENT_TEAM',
            'institution_id': 'inst1'
        },
        # Faculty Observer
        {
            'id': 'faculty1',
            'email': 'faculty@iimc.ac.in',
            'name': 'Faculty Observer',
            'role': 'FACULTY_OBSERVER',
            'institution_id': 'inst1'
        },
        # Recruiters
        {
            'id': 'rec1',
            'email': 'recruiter@mckinsey.com',
            'name': 'McKinsey Recruiter',
            'role': 'RECRUITER',
            'company_id': 'comp1',
            'institution_id': None
        },
        {
            'id': 'rec2',
            'email': 'recruiter@bcg.com',
            'name': 'BCG Recruiter',
            'role': 'RECRUITER',
            'company_id': 'comp2',
            'institution_id': None
        },
        {
            'id': 'rec3',
            'email': 'recruiter@bain.com',
            'name': 'Bain Recruiter',
            'role': 'RECRUITER',
            'company_id': 'comp3',
            'institution_id': None
        },
        # Students
        {
            'id': 'student1',
            'email': 'student1@iimc.ac.in',
            'name': 'Rahul Sharma',
            'role': 'CANDIDATE',
            'institution_id': 'inst1'
        },
        {
            'id': 'student2',
            'email': 'student2@iimc.ac.in',
            'name': 'Priya Patel',
            'role': 'CANDIDATE',
            'institution_id': 'inst1'
        },
        {
            'id': 'student3',
            'email': 'student3@iimc.ac.in',
            'name': 'Amit Kumar',
            'role': 'CANDIDATE',
            'institution_id': 'inst1'
        },
        {
            'id': 'student4',
            'email': 'student4@iimc.ac.in',
            'name': 'Sneha Reddy',
            'role': 'CANDIDATE',
            'institution_id': 'inst1'
        },
        {
            'id': 'student5',
            'email': 'student5@iimc.ac.in',
            'name': 'Vikram Singh',
            'role': 'CANDIDATE',
            'institution_id': 'inst1'
        },
        # Alumni
        {
            'id': 'alumni1',
            'email': 'alumni1@iimc.ac.in',
            'name': 'Rajesh Kumar',
            'role': 'ALUMNI',
            'institution_id': 'inst1'
        },
        {
            'id': 'alumni2',
            'email': 'alumni2@iimc.ac.in',
            'name': 'Meera Desai',
            'role': 'ALUMNI',
            'institution_id': 'inst1'
        },
        # General/Public users
        {
            'id': 'general1',
            'email': 'public@example.com',
            'name': 'Public User',
            'role': 'GENERAL',
            'institution_id': None
        },
        # Additional Placement Team for IIM Ahmedabad
        {
            'id': 'pt2',
            'email': 'placement@iima.ac.in',
            'name': 'Placement Team IIMA',
            'role': 'PLACEMENT_TEAM',
            'institution_id': 'inst2'
        },
        # Additional Faculty Observer
        {
            'id': 'faculty2',
            'email': 'faculty@iima.ac.in',
            'name': 'Faculty Observer IIMA',
            'role': 'FACULTY_OBSERVER',
            'institution_id': 'inst2'
        },
        # Additional Recruiters
        {
            'id': 'rec4',
            'email': 'recruiter@goldmansachs.com',
            'name': 'Goldman Sachs Recruiter',
            'role': 'RECRUITER',
            'company_id': 'comp4',
            'institution_id': None
        },
        {
            'id': 'rec5',
            'email': 'recruiter@amazon.com',
            'name': 'Amazon Recruiter',
            'role': 'RECRUITER',
            'company_id': 'comp5',
            'institution_id': None
        },
        # Additional Students for IIM Ahmedabad
        {
            'id': 'student6',
            'email': 'student6@iima.ac.in',
            'name': 'Arjun Mehta',
            'role': 'CANDIDATE',
            'institution_id': 'inst2'
        },
        {
            'id': 'student7',
            'email': 'student7@iima.ac.in',
            'name': 'Kavita Nair',
            'role': 'CANDIDATE',
            'institution_id': 'inst2'
        }
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
        print("\nSample users created (no password required):")
        print("  System Admin: founders@ithras.com")
        print("  Placement Team: placement@iimc.ac.in, placement@iima.ac.in")
        print("  Faculty: faculty@iimc.ac.in, faculty@iima.ac.in")
        print("  Recruiters: recruiter@mckinsey.com, recruiter@bcg.com, recruiter@bain.com, recruiter@goldmansachs.com, recruiter@amazon.com")
        print("  Students: student1@iimc.ac.in, student2@iimc.ac.in, student3@iimc.ac.in, student4@iimc.ac.in, student5@iimc.ac.in, student6@iima.ac.in, student7@iima.ac.in")
        print("  Alumni: alumni1@iimc.ac.in, alumni2@iimc.ac.in")
        print("  General: public@example.com")
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
