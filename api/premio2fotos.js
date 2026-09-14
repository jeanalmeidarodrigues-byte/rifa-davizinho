const crypto = require("crypto");
const { kv } = require("./_lib/kv");
const { checkAdminPassword } = require("./_lib/auth");

const KEY = "premio2Fotos";

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const data = (await kv.hgetall(KEY)) || {};
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { dataUrl, password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      if (!dataUrl) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      const id = crypto.randomUUID();
      await kv.hset(KEY, { [id]: String(dataUrl) });
      return res.status(200).json({ ok: true, id });
    }

    if (req.method === "DELETE") {
      const { id, password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      if (!id) {
        return res.status(400).json({ error: "Id da foto não informado." });
      }

      await kv.hdel(KEY, id);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno." });
  }
};
