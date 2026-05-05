import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db import execute

def upgrade_schema():
    print("Upgrading database precision to 5 decimal places...")
    
    # Update ration_distribution_students
    execute("ALTER TABLE ration_distribution_students MODIFY COLUMN quantity DECIMAL(10,5) NOT NULL")
    
    # Update ration_distribution_pw
    execute("ALTER TABLE ration_distribution_pw MODIFY COLUMN quantity DECIMAL(10,5) NOT NULL")
    
    # Update ration_inventory
    execute("ALTER TABLE ration_inventory MODIFY COLUMN total_stock DECIMAL(10,5) DEFAULT 0.00000")
    
    # Update ration_stock_in
    execute("ALTER TABLE ration_stock_in MODIFY COLUMN quantity DECIMAL(10,5) NOT NULL")
    
    # Update ration_adjustments
    execute("ALTER TABLE ration_adjustments MODIFY COLUMN quantity DECIMAL(10,5) NOT NULL")

    print("Schema upgrade completed.")

if __name__ == "__main__":
    upgrade_schema()
