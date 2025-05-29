const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;
const dataFilePath = path.join(__dirname, 'holiday_data.json');

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
let isDirty = false; // Track if data has changed

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (index.html)
app.use(express.static(__dirname));

// Load initial data from file
async function loadData() {
    try {
        const fileData = await fs.readFile(dataFilePath, 'utf8');
        data = JSON.parse(fileData);
        console.log('Data loaded from holiday_data.json');
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File doesn't exist, create it with default data
            await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
            console.log('Created holiday_data.json with default data');
        } else {
            console.error('Error loading data:', err);
        }
    }
}

// Auto-save data every 10 seconds if changed
setInterval(async () => {
    if (isDirty) {
        try {
            await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
            console.log('Data auto-saved to holiday_data.json');
            isDirty = false;
        } catch (err) {
            console.error('Error auto-saving data:', err);
        }
    }
}, 10000); // 10 seconds

// API to get data
app.get('/api/data', (req, res) => {
    res.json(data);
});

// API to save data
app.post('/api/data', (req, res) => {
    try {
        data = req.body;
        isDirty = true; // Mark data as changed for auto-save
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Start the server
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    await loadData();
});