import sys
import os
from datetime import datetime, timedelta

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db import execute, fetch_one, fetch_all
from app.services import ration_service

def fix_data():
    # 1. Fix STUD002 attendance for 2026-04-19
    print("Fixing STUD002 attendance for 2026-04-19...")
    execute("UPDATE attendance SET status = 'Present' WHERE student_code = 'STUD002' AND date = '2026-04-19'")
    
    # 2. Add missing distribution for STUD002 on 2026-04-19 (except Eggs, we'll handle eggs separately)
    print("Adding missing distribution for STUD002 on 2026-04-19...")
    
    # Get ration items
    ration_items = fetch_all("SELECT id, item_name FROM ration_items")
    item_map = {item["item_name"]: item["id"] for item in ration_items}
    egg_id = item_map.get("Eggs")
    
    for item_name, per_student_qty in ration_service.PER_STUDENT_DAILY_RATION.items():
        if item_name == "Eggs": continue # Skip eggs for now
        if item_name not in item_map: continue
        
        item_id = item_map[item_name]
        
        # Check stock
        inv = fetch_one("SELECT total_stock FROM ration_inventory WHERE item_id = %s", (item_id,))
        if inv and float(inv["total_stock"]) >= per_student_qty:
            # Record distribution
            execute("""
                INSERT INTO ration_distribution_students (student_id, item_id, quantity, distribution_date, remarks)
                VALUES (%s, %s, %s, %s, %s)
            """, ("STUD002", item_id, per_student_qty, "2026-04-19", "Fixed missing info"))
            
            # Update inventory
            execute("UPDATE ration_inventory SET total_stock = total_stock - %s WHERE item_id = %s", (per_student_qty, item_id))
        else:
            print(f"  Warning: Insufficient stock for {item_name} for STUD002 on 2026-04-19")

    # 3. Fix Eggs consumption: 2 eggs per week (Mondays and Thursdays)
    print("Fixing Egg distributions (2 per week)...")
    
    # 3a. Remove all old egg distributions in the range
    # First, restore stock
    old_egg_total = fetch_one("SELECT SUM(quantity) as total FROM ration_distribution_students WHERE item_id = %s AND distribution_date BETWEEN '2026-04-01' AND '2026-04-19'", (egg_id,))
    if old_egg_total and old_egg_total['total']:
        execute("UPDATE ration_inventory SET total_stock = total_stock + %s WHERE item_id = %s", (old_egg_total['total'], egg_id))
    
    # Delete old records
    execute("DELETE FROM ration_distribution_students WHERE item_id = %s AND distribution_date BETWEEN '2026-04-01' AND '2026-04-19'", (egg_id,))
    
    # 3b. Distribute 1 egg on Mondays and Thursdays
    egg_days = []
    # Week 1: April 1 (Wed), 2 (Thu)
    egg_days.append("2026-04-01") # Wed
    egg_days.append("2026-04-02") # Thu
    # Week 2: April 6 (Mon), 9 (Thu)
    egg_days.append("2026-04-06")
    egg_days.append("2026-04-09")
    # Week 3: April 13 (Mon), 16 (Thu)
    egg_days.append("2026-04-13")
    egg_days.append("2026-04-16")
    
    for d_str in egg_days:
        # Find students present on this day
        present_students = fetch_all("SELECT DISTINCT student_code FROM attendance WHERE date = %s AND status = 'Present'", (d_str,))
        for s in present_students:
            execute("""
                INSERT INTO ration_distribution_students (student_id, item_id, quantity, distribution_date, remarks)
                VALUES (%s, %s, %s, %s, %s)
            """, (s["student_code"], egg_id, 1.0, d_str, "Fixed: 2 eggs per week"))
            
            # Update inventory
            execute("UPDATE ration_inventory SET total_stock = total_stock - 1 WHERE item_id = %s", (egg_id,))

    print("Data fix completed.")

if __name__ == "__main__":
    fix_data()
