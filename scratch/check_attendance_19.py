import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))
from app.db import fetch_all

def check_attendance():
    att = fetch_all("SELECT student_code, status FROM attendance WHERE date = '2026-04-19'")
    print("Attendance on 2026-04-19:", att)

if __name__ == "__main__":
    check_attendance()
