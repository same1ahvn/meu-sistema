import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ sucesso: true, hora: result.rows[0] });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
