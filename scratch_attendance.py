import sys
import os
from datetime import date, timedelta

# Add the project root to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.db import execute, fetch_all

def check_holiday(d: date):
    if d.weekday() == 6: # Sunday
        return True
    
    month_day = d.strftime("%m-%d")
    holidays = ["01-26", "08-15", "10-02"]
    if month_day in holidays:
        return True
        
    return False

def populate_attendance():
    start_date = date(2026, 4, 1)
    end_date = date(2026, 4, 19)
    
    students = fetch_all("SELECT student_id, name FROM students")
    if not students:
        print("No students found.")
        return
        
    print(f"Found {len(students)} students.")
    
    current_date = start_date
    added_count = 0
    updated_count = 0
    
    while current_date <= end_date:
        if check_holiday(current_date):
            current_date += timedelta(days=1)
            continue
            
        date_str = current_date.isoformat()
        
        # Get existing attendance for this date
        existing = fetch_all("SELECT student_code, status FROM attendance WHERE date = %s", (date_str,))
        existing_map = {r['student_code']: r['status'] for r in existing}
        
        for student in students:
            student_code = student['student_id']
            student_name = student['name']
            
            if student_code in existing_map:
                if existing_map[student_code] != "Present":
                    execute("UPDATE attendance SET status = 'Present' WHERE student_code = %s AND date = %s", (student_code, date_str))
                    updated_count += 1
            else:
                cursor = execute(
                    """
                    INSERT INTO attendance (entry_id, student_code, student_name, date, status)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (None, student_code, student_name, date_str, "Present"),
                )
                entry_id = f"AT{str(cursor.lastrowid).zfill(4)}"
                execute("UPDATE attendance SET entry_id = %s WHERE id = %s", (entry_id, cursor.lastrowid))
                added_count += 1
                
        current_date += timedelta(days=1)
        
    print(f"Done! Added {added_count} new records and updated {updated_count} existing records to Present.")

if __name__ == "__main__":
    populate_attendance()
