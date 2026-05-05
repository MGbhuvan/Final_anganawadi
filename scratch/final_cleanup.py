import sys
import os
from datetime import datetime, timedelta

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db import execute, fetch_all, fetch_one
from app.services import ration_service

def cleanup_and_reprocess():
    start_date = "2026-04-01"
    end_date = "2026-04-19"
    
    print(f"Cleaning up distributions from {start_date} to {end_date}...")
    
    # 1. Restore stock from ALL student distributions in this range
    all_dist = fetch_all("""
        SELECT item_id, SUM(quantity) as total_qty 
        FROM ration_distribution_students 
        WHERE distribution_date BETWEEN %s AND %s
        GROUP BY item_id
    """, (start_date, end_date))
    
    for dist in all_dist:
        print(f"  Restoring {dist['total_qty']} for item_id {dist['item_id']}...")
        execute("UPDATE ration_inventory SET total_stock = total_stock + %s WHERE item_id = %s", (dist['total_qty'], dist['item_id']))
    
    # 2. Delete all student distributions in this range
    execute("DELETE FROM ration_distribution_students WHERE distribution_date BETWEEN %s AND %s", (start_date, end_date))
    print("  All messy records deleted.")

    # 3. Add unique constraint to prevent duplicates in the future
    try:
        print("  Adding unique constraint to ration_distribution_students...")
        execute("ALTER TABLE ration_distribution_students ADD UNIQUE KEY uq_student_item_date (student_id, item_id, distribution_date)")
    except Exception as e:
        print(f"  Note: Could not add constraint (maybe it exists?): {e}")

    # 4. Re-run distribution for each day
    current = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    print("\nRe-processing distributions with correct precision and no duplicates...")
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        try:
            # We use the service which now has the Monday/Thursday egg logic
            res = ration_service.auto_distribute_students({"date": date_str})
            print(f"  {date_str}: {res['message']}")
        except Exception as e:
            if "No students marked Present" not in str(e):
                print(f"  {date_str}: Error - {e}")
        current += timedelta(days=1)

    print("\nFinal cleanup completed. Inventory and distribution records are now accurate.")

if __name__ == "__main__":
    cleanup_and_reprocess()
