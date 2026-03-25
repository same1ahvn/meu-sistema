import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    const result = await pool.query("SELECT id, nome, username, role FROM usuarios");

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
