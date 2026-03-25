import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS solicitacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER,
        tipo VARCHAR(20),
        data DATE,
        motivo TEXT,
        status VARCHAR(20) DEFAULT 'pendente'
      );
    `);

    res.status(200).json({ msg: "Tabela de solicitações criada 🚀" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}
