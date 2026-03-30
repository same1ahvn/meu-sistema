import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {

  try {
    const usuarios = await pool.query("SELECT id, senha FROM usuarios");

    for (let u of usuarios.rows) {
      if (!u.senha.startsWith("$2")) {
        const hash = await bcrypt.hash(u.senha, 10);

        await pool.query(
          "UPDATE usuarios SET senha = $1 WHERE id = $2",
          [hash, u.id]
        );
      }
    }

    res.json({ sucesso: true });

  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}
