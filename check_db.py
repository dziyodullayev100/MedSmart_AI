import sqlite3
import pprint

try:
    conn = sqlite3.connect('backend/data/medsmart.sqlite')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print("Tables:", cursor.fetchall())
    
    cursor.execute('SELECT email, password FROM Users;')
    print('\nUsers:', cursor.fetchall())
    
    cursor.execute('SELECT email, password FROM Patients;')
    print('\nPatients:', cursor.fetchall())
    
    cursor.execute('SELECT email, password FROM Doctors;')
    print('\nDoctors:', cursor.fetchall())
except Exception as e:
    print("Error:", e)
