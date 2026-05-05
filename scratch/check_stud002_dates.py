import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))
from app.db import fetch_all

def check_dates():
    dates = fetch_all("SELECT DISTINCT distribution_date FROM ration_distribution_students WHERE student_id = 'STUD002' ORDER BY distribution_date")
    print("Dates for STUD002:", [str(d['distribution_date']) for d in dates])

if __name__ == "__main__":
    check_dates()
