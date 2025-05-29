const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS holiday_data (
    id SERIAL PRIMARY KEY,
    data JSONB
  );
`, (err) => {
  if (err) console.error('Error creating table:', err);
  else console.log('Table ready!');
});

// Load data
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM holiday_data ORDER BY id DESC LIMIT 1');
    const row = result.rows[0];
    res.json(row ? row.data : {});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});

// Save data
app.post('/api/data', async (req, res) => {
  try {
    const data = req.body;

    // Apply pro-rata allowance based on start date
    for (let emp in data.employees) {
      const employee = data.employees[emp];
      if (employee.startDate && employee.originalAllowance) {
        employee.allowance = calculateProRata(employee.startDate, employee.originalAllowance);
      }
    }

    await pool.query('INSERT INTO holiday_data (data) VALUES ($1)', [data]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving data');
  }
});

// Undo rollover
app.post('/api/undo-rollover', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM holiday_data ORDER BY id DESC LIMIT 1');
    const row = result.rows[0];
    if (!row) return res.json({ success: false, message: 'No data to undo.' });

    let data = row.data;

    for (let emp in data.employees) {
      let employee = data.employees[emp];
      if (employee.rollover) {
        employee.allowance -= employee.rollover;
        delete employee.rollover;
      }
    }

    await pool.query('INSERT INTO holiday_data (data) VALUES ($1)', [data]);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error undoing rollover.');
  }
});

// Pro-rata calculation function
function calculateProRata(startDate, allowance) {
  const start = new Date(startDate);
  const now = new Date();
  if (start.getFullYear() !== now.getFullYear()) return allowance;

  const totalDays = (new Date(now.getFullYear(), 11, 31) - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24) + 1;
  const remainingDays = (new Date(now.getFullYear(), 11, 31) - start) / (1000 * 60 * 60 * 24) + 1;
  const proRata = Math.round((remainingDays / totalDays) * allowance);
  return proRata > allowance ? allowance : proRata;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
