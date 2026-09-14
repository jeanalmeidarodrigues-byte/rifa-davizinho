const { kv } = require("./_lib/kv");
const { checkAdminPassword } = require("./_lib/auth");

const KEY = "config";

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const data = (await kv.hgetall(KEY)) || {};
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { titulo, subtitulo, regras, loteria, quantidade, grupoWhatsapp, password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      const atualizacoes = {};
      if (titulo) atualizacoes.titulo = String(titulo).slice(0, 120);
      if (subtitulo) atualizacoes.subtitulo = String(subtitulo).slice(0, 200);
      if (regras) atualizacoes.regras = String(regras).slice(0, 4000);
      if (loteria) atualizacoes.loteria = String(loteria).slice(0, 1000);
      if (grupoWhatsapp) atualizacoes.grupoWhatsapp = String(grupoWhatsapp).slice(0, 300);

      if (quantidade !== undefined && quantidade !== null && quantidade !== "") {
        const qtd = parseInt(quantidade, 10);
        if (isNaN(qtd) || qtd < 1 || qtd > 100) {
          return res.status(400).json({ error: "A quantidade de números deve ser entre 1 e 100." });
        }
        atualizacoes.quantidade = String(qtd);
      }

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
