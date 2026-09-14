const { kv } = require("./_lib/kv");
const { checkAdminPassword } = require("./_lib/auth");

const KEY = "premio1";

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const data = (await kv.hgetall(KEY)) || {};
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { foto, historia, password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      const atualizacoes = {};
      if (historia) atualizacoes.historia = String(historia).slice(0, 2000);
      if (foto) atualizacoes.foto = String(foto);

      if (Object.keys(atualizacoes).length === 0) {
        return res.status(400).json({ error: "Nada para salvar." });
      }

      await kv.hset(KEY, atualizacoes);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno." });
  }
};
