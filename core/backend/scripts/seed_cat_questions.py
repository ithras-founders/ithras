"""
Seed CAT question bank with sample questions for VARC, DILR, QA.
Run from ithras root: docker compose run --rm backend python /app/scripts/seed_cat_questions.py
Or: cd core/backend && python scripts/seed_cat_questions.py
"""
import os
import sys
import uuid

# Support both direct run (core/backend) and Docker (/app)
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base not in sys.path:
    sys.path.insert(0, base)

from sqlalchemy.orm import Session
from app.modules.shared.database import SessionLocal
from app.modules.shared.models import PrepQuestionBank

# Sample questions per section (MVP - 20+ per section)
VARC_QUESTIONS = [
    {"topic": "Reading_Comprehension", "text": "According to the passage, the primary reason for the decline in biodiversity is:\n(A) climate change\n(B) habitat destruction\n(C) overfishing\n(D) pollution", "options": ["climate change", "habitat destruction", "overfishing", "pollution"], "correct": 1, "diff": "MEDIUM"},
    {"topic": "Reading_Comprehension", "text": "The author's tone in the passage can best be described as:\n(A) neutral\n(B) critical\n(C) admiring\n(D) sarcastic", "options": ["neutral", "critical", "admiring", "sarcastic"], "correct": 1, "diff": "EASY"},
    {"topic": "Para_Jumbles", "text": "Rearrange: P) The economy Q) recovered R) slowly S) after the crisis", "options": ["PQRS", "PRQS", "QRPS", "QPRS"], "correct": 0, "diff": "EASY"},
    {"topic": "Para_Jumbles", "text": "Which order makes the paragraph coherent?\nSentences: A) First, B) Then, C) Finally, D) Thus", "options": ["ABCD", "ACBD", "BCAD", "DCBA"], "correct": 0, "diff": "MEDIUM"},
    {"topic": "Vocab_Usage", "text": "Choose the correctly spelled word:", "options": ["accomodate", "accommodate", "acommodate", "acomodate"], "correct": 1, "diff": "EASY"},
    {"topic": "Vocab_Fill", "text": "The new policy will _____ the existing regulations. (fill: supersede / supercede / superceed)", "options": ["supersede", "supercede", "superceed", "supersead"], "correct": 0, "diff": "MEDIUM"},
] * 4  # 24 VARC

DILR_QUESTIONS = [
    {"topic": "DI_Tables", "text": "If sales in Q3 were 120% of Q2, and Q2 = 100, what was Q3?", "options": ["100", "120", "110", "130"], "correct": 1, "diff": "EASY"},
    {"topic": "DI_Graphs", "text": "From the bar graph, the year with maximum growth was:", "options": ["2020", "2021", "2022", "2023"], "correct": 2, "diff": "MEDIUM"},
    {"topic": "LR_Arrangements", "text": "Five people sit in a row. A is left of B. C is right of B. D is at an end. Who is in the middle?", "options": ["A", "B", "C", "D"], "correct": 1, "diff": "MEDIUM"},
    {"topic": "LR_Puzzles", "text": "In a game, X beats Y, Y beats Z, Z beats X. Who wins the tournament of one round each?", "options": ["X", "Y", "Z", "Cannot determine"], "correct": 3, "diff": "HARD"},
    {"topic": "DI_Caselets", "text": "A company has 3 products. Product A: 40% revenue, B: 35%, C: 25%. If total revenue is 100cr, what is B's revenue?", "options": ["25", "35", "40", "30"], "correct": 1, "diff": "EASY"},
] * 5  # 25 DILR

QA_QUESTIONS = [
    {"topic": "Arithmetic", "text": "A train travels 120 km in 2 hours. What is its speed in km/hr?", "options": ["50", "60", "70", "80"], "correct": 1, "diff": "EASY"},
    {"topic": "Arithmetic", "text": "If 20% of x is 40, what is x?", "options": ["100", "200", "150", "250"], "correct": 1, "diff": "EASY"},
    {"topic": "Algebra", "text": "Solve: 2x + 5 = 15", "options": ["3", "5", "6", "10"], "correct": 1, "diff": "EASY"},
    {"topic": "Algebra", "text": "If x^2 = 49, then x can be:", "options": ["7 only", "-7 only", "7 or -7", "49"], "correct": 2, "diff": "MEDIUM"},
    {"topic": "Number_System", "text": "What is the remainder when 17 is divided by 5?", "options": ["1", "2", "3", "4"], "correct": 1, "diff": "EASY"},
    {"topic": "Geometry", "text": "Area of a rectangle 10m x 5m is:", "options": ["15", "50", "30", "25"], "correct": 1, "diff": "EASY"},
    {"topic": "Mensuration", "text": "Volume of a cube of side 3 cm is:", "options": ["9", "18", "27", "12"], "correct": 2, "diff": "EASY"},
    {"topic": "PnC_Probability", "text": "In how many ways can 3 books be arranged on a shelf?", "options": ["3", "6", "9", "12"], "correct": 1, "diff": "MEDIUM"},
] * 4  # 32 QA


def seed_section(db: Session, section: str, questions: list):
    count = db.query(PrepQuestionBank).filter(
        PrepQuestionBank.category == "CAT",
        PrepQuestionBank.question_text == questions[0]["text"],
    ).count()
    if count > 0:
        print(f"CAT questions for {section} appear to exist. Skipping.")
        return 0

    added = 0
    for i, q in enumerate(questions):
        qid = f"cat_{section}_{uuid.uuid4().hex[:10]}"
        meta = {
            "section": section,
            "topic": q["topic"],
            "question_type": "MCQ",
            "options": q["options"],
            "correct_option": q["correct"],
            "marks_correct": 3,
            "marks_wrong": -1,
        }
        row = PrepQuestionBank(
            id=qid,
            category="CAT",
            difficulty=q.get("diff", "MEDIUM"),
            source="curated",
            question_text=q["text"],
            extra_meta=meta,
        )
        db.add(row)
        added += 1
    return added


def main():
    db = SessionLocal()
    try:
        v = seed_section(db, "VARC", VARC_QUESTIONS)
        d = seed_section(db, "DILR", DILR_QUESTIONS)
        q = seed_section(db, "QA", QA_QUESTIONS)
        db.commit()
        print(f"Seeded: VARC={v}, DILR={d}, QA={q} (total={v+d+q})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
