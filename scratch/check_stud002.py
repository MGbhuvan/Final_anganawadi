import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app.db import fetch_one, fetch_all

def check_stud002():
    student = fetch_one("SELECT * FROM students WHERE student_id = 'stud002'")
    print("Student info:", student)
    
    attendance = fetch_all("SELECT date, status FROM attendance WHERE student_code = 'stud002' AND date BETWEEN '2026-04-01' AND '2026-04-19'")
    print(f"Attendance records for stud002: {len(attendance)}")
    for a in attendance:
        print(f"  {a['date']}: {a['status']}")

    distribution = fetch_all("SELECT distribution_date, item_id, quantity FROM ration_distribution_students WHERE student_id = 'stud002' AND distribution_date BETWEEN '2026-04-01' AND '2026-04-19'")
    print(f"Distribution records for stud002: {len(distribution)}")

if __name__ == "__main__":
    check_stud002()
