import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100),
        username VARCHAR(50) UNIQUE,
        senha TEXT,
        role VARCHAR(20) DEFAULT 'funcionario'
      );
    `);

    res.status(200).json({ mensagem: "Tabela criada com sucesso 🚀" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
