"""Database Seed Script.

Migrates the 1,000 products from CSV into PostgreSQL database tables.
Runs idempotently: if products already exist in PostgreSQL, it skips inserting.
"""

import os
import sys
import pandas as pd
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.database.connection import init_db, get_session
from backend.database.models import Product, Base


def seed_database(csv_path: str = None, bind: str = "default"):
    """Populate database from CSV if empty."""
    init_db()
    session = get_session(bind)

    try:
        count = session.query(Product).count()
        if count > 0:
            print(f"Database ('{bind}') already has {count} products. Skipping seed.")
            return count

        if not csv_path:
            csv_path = os.path.join(ROOT_DIR, "data", "ecommerce_products_1000.csv")

        if not os.path.exists(csv_path):
            print(f"CSV file not found at: {csv_path}")
            return 0

        print(f"Seeding database from: {csv_path}...")
        df = pd.read_csv(csv_path)

        products = []
        for _, row in df.iterrows():
            prod = Product(
                product_id=str(row["product_id"]),
                name=str(row["name"]),
                category=str(row["category"]),
                subcategory=str(row["subcategory"]),
                brand=str(row["brand"]),
                price=float(row.get("price", 0.0)),
                discount_percent=float(row.get("discount_percent", 0.0)),
                sale_price=float(row.get("sale_price", 0.0)),
                description=str(row.get("description", "")),
                rating=float(row.get("rating", 0.0)),
                review_count=int(row.get("review_count", 0)),
                sizes=str(row.get("sizes", "")),
                colors=str(row.get("colors", "")),
                stock_quantity=int(row.get("stock_quantity", 0)),
                in_stock=bool(row.get("in_stock", True)),
                material=str(row.get("material", "")),
                tags=str(row.get("tags", "")),
            )
            products.append(prod)

        session.bulk_save_objects(products)
        session.commit()
        print(f"Successfully seeded {len(products)} products into PostgreSQL database!")
        return len(products)
    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
