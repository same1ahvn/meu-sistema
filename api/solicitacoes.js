import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {

  // =============================
  // LISTAR
  // =============================
  if (req.method === "GET") {
    const result = await pool.query(`
      SELECT s.*, u.nome 
      FROM solicitacoes s
      JOIN usuarios u ON s.usuario_id = u.id
      ORDER BY s.id DESC
    `);

    return res.json(result.rows);
  }

  // =============================
  // CRIAR
  // =============================
  if (req.method === "POST") {
    const { usuario_id, tipo, data, motivo } = req.body;

    await pool.query(
      `INSERT INTO solicitacoes (usuario_id, tipo, data, motivo)
       VALUES ($1,$2,$3,$4)`,
      [usuario_id, tipo, data, motivo]
    );

    return res.json({ sucesso: true });
  }

  // =============================
  // ATUALIZAR STATUS
  // =============================
  if (req.method === "PUT") {
    const { id, status } = req.body;

    await pool.query(
      `UPDATE solicitacoes SET status = $1 WHERE id = $2`,
      [status, id]
    );

    return res.json({ sucesso: true });
  }

}
