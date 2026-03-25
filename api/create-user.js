import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    const senhaHash = await bcrypt.hash("123456", 10);

    await pool.query(
      `INSERT INTO usuarios (nome, username, senha, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ["Admin", "admin", senhaHash, "adm"]
    );

    res.status(200).json({ mensagem: "Usuário criado!" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
