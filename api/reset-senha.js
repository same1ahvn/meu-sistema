import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    const hash = await bcrypt.hash("123456", 10);

    await pool.query(
      "UPDATE usuarios SET senha = $1",
      [hash]
    );

    res.json({ sucesso: true, senha: "123456 PARA TODOS" });

  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}
