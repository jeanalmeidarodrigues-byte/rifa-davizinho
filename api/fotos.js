const { kv } = require("./_lib/kv");
const { checkAdminPassword } = require("./_lib/auth");

const KEY = "fotos";
const CONFIG_KEY = "config";
const DEFAULT_QUANTIDADE = 100;

// Busca a quantidade de números da rifa configurada pelo organizador (padrão: 100 => 00 a 99).
async function getQuantidade() {
  const valor = await kv.hget(CONFIG_KEY, "quantidade");
  const qtd = parseInt(valor, 10);
  if (!qtd || qtd < 1 || qtd > 100) return DEFAULT_QUANTIDADE;
  return qtd;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const data = (await kv.hgetall(KEY)) || {};
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { numero, dataUrl, password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      const num = parseInt(numero, 10);
      const quantidade = await getQuantidade();
      if (isNaN(num) || num < 0 || num >= quantidade || !dataUrl) {
        return res.status(400).json({ error: "Dados inválidos." });
      }

      await kv.hset(KEY, { [String(num)]: String(dataUrl) });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { numero, password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      const num = parseInt(numero, 10);
      const quantidade = await getQuantidade();
      if (isNaN(num) || num < 0 || num >= quantidade) {
        return res.status(400).json({ error: "Número inválido." });
      }

      await kv.hdel(KEY, String(num));
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno." });
  }
};
