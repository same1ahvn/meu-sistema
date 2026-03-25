import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    const { nome, username, senha, role } = req.body;

    const hash = await bcrypt.hash(senha, 10);

    await pool.query(
      `INSERT INTO usuarios (nome, username, senha, role)
       VALUES ($1, $2, $3, $4)`,
      [nome, username, hash, role]
    );

    res.status(200).json({ mensagem: "Usuário criado!" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
