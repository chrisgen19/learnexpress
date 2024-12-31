
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3001;

require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.use(express.json()); // Middleware to parse JSON

app.post('/users', async (req, res) => {

    const { name, email, address } = req.body;

    if (!name || !email) {
        return res.status(400).send('Name and email are required');
    }

    try {

        const { rows } = await pool.query(
            'INSERT INTO users (name, email, address) VALUES ($1, $2, $3) RETURNING *',
            [name, email, address || null]
        );

        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
  }
});

app.get('/', (req, res) => {
    res.send('Hello World!!!!!');
});

// About route
app.get('/about', (req, res) => {
    res.send('About Page');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

module.exports = app;