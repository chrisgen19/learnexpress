const express = require("express");
const { hashPassword } = require('./utils');
const { Pool } = require("pg");
const app = express();
const port = 3001;

require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.json()); // Middleware to parse JSON

// CREATE USERS
app.post('/users', async (req, res) => {
    const { name, email, address, username, password } = req.body;
    if (!name || !email || !username || !password) {
        return res.status(400).send('Name, email, username, and password are required');
    }
    try {
        const hashedPassword = await hashPassword(password); // Hash the password
        const query = `
            INSERT INTO users (name, email, address, username, password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`;
        const values = 
            [
                name, 
                email, 
                address || null, 
                username, 
                hashedPassword
            ];
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).send('Server error');
    }
});

// READ USERS
app.get("/users", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).send("Server error");
  }
});

// READ USER BY ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).send("User not found");
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).send("Server error");
  }
});

// UPDATE USER BY ID
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, address, username, password } = req.body;

    // Check if at least one field is provided
    if (!name && !email && !address && !username && !password) {
        return res.status(400).send('At least one field is required');
    }

    try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name) {
        updates.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
        }
        if (email) {
        updates.push(`email = $${paramIndex}`);
        values.push(email);
        paramIndex++;
        }
        if (address) {
        updates.push(`address = $${paramIndex}`);
        values.push(address);
        paramIndex++;
        }
        if (username) {
        updates.push(`username = $${paramIndex}`);
        values.push(username);
        paramIndex++;
        }
        if (password) {
        const hashedPassword = await hashPassword(password); // Hash the password
        updates.push(`password = $${paramIndex}`);
        values.push(hashedPassword);
        paramIndex++;
        }

        // Add the id to the values array
        values.push(id);

        // Construct the final query
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        // Execute the query
        const { rows } = await pool.query(query, values);
        if (rows.length === 0) {
        return res.status(404).send('User not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).send('Server error');
    }
});

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).send("User not found");
    }
    res.json({ message: "User deleted", user: rows[0] });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).send("Server error");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!!!!!");
});

// About route
app.get("/about", (req, res) => {
  res.send("About Page");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

module.exports = app;
