const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public folder (or root)
app.use(express.static(path.join(__dirname, 'public'))); // If using 'public'
app.use(express.static(path.join(__dirname))); // If using root

// Holiday data (example - in-memory)
let data = {
  employees: {
    Levi: { allowance: 25, bookings: [], startDate: '2025-01-01' },
    Efan: { allowance: 25, bookings: [], startDate: '2025-01-01' },
    Freddie: { allowance: 25, bookings: [], startDate: '2025-01-01' },
    Will: { allowance: 25, bookings: [], startDate: '2025-01-01' },
    Cory: { allowance: 25, bookings: [], startDate: '2025-01-01' },
    Richard: { allowance: 25, bookings: [], startDate: '2025-01-01' },
    Jordan: { allowance: 25, bookings: [], startDate: '2025-01-01' }
  },
  rolloverPerformed: false
};

// API endpoints
app.get('/api/data', (req, res) => res.json(data));
app.post('/api/data', (req, res) => {
  data = req.body;
  res.json({ success: true });
});

// Serve index.html for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // If using 'public'
  // Or just __dirname if not using 'public'
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
