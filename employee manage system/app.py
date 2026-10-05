from flask import Flask, render_template, request, redirect, url_for, flash
import sqlite3
from sqlite3 import IntegrityError
import os

# Configuration
DATABASE = 'database.db'
SECRET_KEY = os.environ.get('FLASK_SECRET', 'dev_secret_key')

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY


def get_db_connection():
    """Create a new database connection and return it with Row factory."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database and create the employees table if it doesn't exist."""
    conn = get_db_connection()
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            department TEXT NOT NULL,
            salary REAL NOT NULL,
            joining_date TEXT NOT NULL
        )
        '''
    )
    conn.commit()
    conn.close()


@app.route('/')
def index():
    """Dashboard: list employees, support optional search and department filter."""
    search = request.args.get('search', '').strip()
    department = request.args.get('department', '').strip()

    conn = get_db_connection()
    query = 'SELECT * FROM employees'
    filters = []
    params = []

    if search:
        filters.append('(name LIKE ? OR email LIKE ? OR department LIKE ?)')
        like = f"%{search}%"
        params.extend([like, like, like])

    if department and department != 'All':
        filters.append('department = ?')
        params.append(department)

    if filters:
        query += ' WHERE ' + ' AND '.join(filters)

    query += ' ORDER BY id DESC'
    employees = conn.execute(query, params).fetchall()

    # Dashboard counts
    total = conn.execute('SELECT COUNT(*) FROM employees').fetchone()[0]
    dept_counts = conn.execute('SELECT department, COUNT(*) as cnt FROM employees GROUP BY department').fetchall()
    departments = [row['department'] for row in conn.execute('SELECT DISTINCT department FROM employees').fetchall()]
    conn.close()

    return render_template('index.html', employees=employees, total=total, dept_counts=dept_counts, departments=departments, search=search, selected_department=department)


@app.route('/add', methods=['GET', 'POST'])
def add_employee():
    """Add a new employee to the database with validation and flash messages."""
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        department = request.form.get('department', '').strip()
        salary = request.form.get('salary', '').strip()
        joining_date = request.form.get('joining_date', '').strip()

        # Basic validation
        if not (name and email and phone and department and salary and joining_date):
            flash('Please fill all required fields.', 'danger')
            return redirect(url_for('add_employee'))

        try:
            salary_val = float(salary)
        except ValueError:
            flash('Salary must be a number.', 'danger')
            return redirect(url_for('add_employee'))

        try:
            conn = get_db_connection()
            conn.execute('INSERT INTO employees (name, email, phone, department, salary, joining_date) VALUES (?, ?, ?, ?, ?, ?)',
                         (name, email, phone, department, salary_val, joining_date))
            conn.commit()
            conn.close()
            flash('Employee added successfully.', 'success')
            return redirect(url_for('index'))
        except IntegrityError:
            flash('The provided email already exists.', 'danger')
            return redirect(url_for('add_employee'))
        except Exception as e:
            flash(f'An error occurred: {e}', 'danger')
            return redirect(url_for('add_employee'))

    return render_template('add_employee.html')


@app.route('/edit/<int:emp_id>', methods=['GET', 'POST'])
def edit_employee(emp_id):
    """Edit employee details."""
    conn = get_db_connection()
    emp = conn.execute('SELECT * FROM employees WHERE id = ?', (emp_id,)).fetchone()
    if not emp:
        conn.close()
        flash('Employee not found.', 'danger')
        return redirect(url_for('index'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        department = request.form.get('department', '').strip()
        salary = request.form.get('salary', '').strip()
        joining_date = request.form.get('joining_date', '').strip()

        if not (name and email and phone and department and salary and joining_date):
            flash('Please fill all required fields.', 'danger')
            return redirect(url_for('edit_employee', emp_id=emp_id))

        try:
            salary_val = float(salary)
        except ValueError:
            flash('Salary must be a number.', 'danger')
            return redirect(url_for('edit_employee', emp_id=emp_id))

        try:
            conn.execute('UPDATE employees SET name=?, email=?, phone=?, department=?, salary=?, joining_date=? WHERE id=?',
                         (name, email, phone, department, salary_val, joining_date, emp_id))
            conn.commit()
            conn.close()
            flash('Employee updated successfully.', 'success')
            return redirect(url_for('index'))
        except IntegrityError:
            flash('The provided email already exists.', 'danger')
            return redirect(url_for('edit_employee', emp_id=emp_id))
        except Exception as e:
            flash(f'An error occurred: {e}', 'danger')
            return redirect(url_for('edit_employee', emp_id=emp_id))

    conn.close()
    return render_template('edit_employee.html', emp=emp)


@app.route('/delete/<int:emp_id>', methods=['POST'])
def delete_employee(emp_id):
    """Delete an employee record."""
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM employees WHERE id = ?', (emp_id,))
        conn.commit()
        conn.close()
        flash('Employee deleted successfully.', 'success')
    except Exception as e:
        flash(f'An error occurred: {e}', 'danger')
    return redirect(url_for('index'))


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
