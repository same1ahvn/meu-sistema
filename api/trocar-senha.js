import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { id, novaSenha } = req.body;

  if (!id || !novaSenha) {
    return res.status(400).json({ erro: "Dados inválidos" });
  }

  try {
    const hash = await bcrypt.hash(novaSenha, 10);

    await pool.query(
      "UPDATE usuarios SET senha = $1 WHERE id = $2",
      [hash, id]
    );

    res.status(200).json({ sucesso: true });

  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
