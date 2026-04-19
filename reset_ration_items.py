import sys
import os

# Add the project root to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.db import execute

def reset_ration_items():
    # Disable foreign key checks to allow deletion
    execute("SET FOREIGN_KEY_CHECKS = 0")
    
    tables_to_clear = [
        "ration_distribution_pw",
        "ration_distribution_students",
        "ration_stock_in",
        "ration_inventory",
        "ration_adjustments",
        "ration_items"
    ]
    
    for table in tables_to_clear:
        execute(f"DELETE FROM {table}")
        # Reset auto-increment
        execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")
    
    new_items = [
        ("Rice", "kg"),
        ("Toor Dal (Pigeon Pea)", "kg"),
        ("Salt", "g"),
        ("Oil", "L"),
        ("Soya Chunks", "kg"),
        ("Sambar Powder", "g"),
        ("Mustard & Black Pepper", "g"),
        ("Bengal Gram (Chana Dal)", "kg"),
        ("Jaggery", "kg"),
        ("Millet Laddu", "pcs"),
        ("Eggs", "pcs"),
        ("Milk Powder", "g"),
        ("Sugar", "kg")
    ]
    
    for name, unit in new_items:
        execute("INSERT INTO ration_items (item_name, unit) VALUES (%s, %s)", (name, unit))
    
    # Re-enable foreign key checks
    execute("SET FOREIGN_KEY_CHECKS = 1")
    
    print(f"Successfully re-set ration items to {len(new_items)} items.")

if __name__ == "__main__":
    reset_ration_items()
