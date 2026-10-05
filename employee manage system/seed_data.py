"""Seed sample employee data into database.db
Run: python seed_data.py
"""
import sqlite3
from pathlib import Path

db_path = Path('database.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute('''CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    joining_date TEXT NOT NULL
)
''')

seed = [
    ("Alice Johnson","alice.johnson@example.com","555-0101","Engineering",75000.00,"2023-05-10"),
    ("Bob Smith","bob.smith@example.com","555-0102","HR",62000.00,"2022-11-01"),
    ("Carol Lee","carol.lee@example.com","555-0103","Sales",68000.50,"2021-08-15"),
    ("David Kim","david.kim@example.com","555-0104","Engineering",80000.00,"2020-02-20"),
    ("Eva Green","eva.green@example.com","555-0105","Marketing",59000.00,"2024-01-05"),
    ("Alice Johnson","alice.johnson@example.com","555-0101","Engineering",75000.00,"2023-05-10"),
]

inserted = 0
for row in seed:
    try:
        cur.execute('INSERT INTO employees (name,email,phone,department,salary,joining_date) VALUES (?,?,?,?,?,?)', row)
        inserted += 1
    except sqlite3.IntegrityError:
        pass

conn.commit()
rows = cur.execute('SELECT id, name, email, department FROM employees ORDER BY id').fetchall()
conn.close()

print({'inserted': inserted, 'total_rows': len(rows), 'rows': rows})
