const { kv } = require("./_lib/kv");
const { checkAdminPassword } = require("./_lib/auth");

const HASH_KEY = "reservas";
const RESERVATION_TIME = 10 * 60 * 1000;

function formatNumber(num) {
  return String(num).padStart(3, "0");
}

// Um número é considerado "ocupado" (não disponível para nova reserva) se:
// - está pago ("sold"); ou
// - está reservado e a reserva ainda não expirou.
function isEntryActive(item) {
  if (!item) return false;
  if (item.status === "sold") return true;
  if (item.status === "reserved") {
    return !item.expiresAt || Date.now() <= item.expiresAt;
  }
  return false;
}

// Remove do banco as reservas temporárias já expiradas (faxina leve a cada leitura).
async function cleanupExpired(data) {
  const expiradas = Object.keys(data).filter(num => {
    const item = data[num];
    return item && item.status === "reserved" && item.expiresAt && Date.now() > item.expiresAt;
  });

  if (expiradas.length > 0) {
    await kv.hdel(HASH_KEY, ...expiradas);
  }

  return expiradas.length > 0;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      let data = (await kv.hgetall(HASH_KEY)) || {};
      const mudou = await cleanupExpired(data);
      if (mudou) {
        data = (await kv.hgetall(HASH_KEY)) || {};
      }
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      // Reserva pública: qualquer visitante pode reservar um número livre.
      const { numero, cliente, whatsapp, tema } = req.body || {};
      const num = parseInt(numero, 10);

      if (!num || num < 1 || num > 100 || !cliente || !whatsapp) {
        return res.status(400).json({ error: "Dados inválidos. Preencha nome e WhatsApp." });
      }

      const atual = await kv.hget(HASH_KEY, String(num));
      if (isEntryActive(atual)) {
        return res.status(409).json({ error: "Este número acabou de ser reservado por outra pessoa. Escolha outro." });
      }

      const entry = {
        status: "reserved",
        cliente: String(cliente).slice(0, 100),
        whatsapp: String(whatsapp).replace(/\D/g, "").slice(0, 20),
        numero: formatNumber(num),
        tema: String(tema || "").slice(0, 60),
        createdAt: Date.now(),
        expiresAt: Date.now() + RESERVATION_TIME
      };

      await kv.hset(HASH_KEY, { [String(num)]: entry });
      return res.status(200).json({ ok: true, entry });
    }

    if (req.method === "PUT") {
      // Ações do organizador: marcar como pago ou liberar um número específico.
      const { numero, action, password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      const num = parseInt(numero, 10);
      if (!num || num < 1 || num > 100) {
        return res.status(400).json({ error: "Número inválido." });
      }

      if (action === "sold") {
        const atual = (await kv.hget(HASH_KEY, String(num))) || {};
        const entry = { ...atual, status: "sold", numero: formatNumber(num), paidAt: Date.now() };
        await kv.hset(HASH_KEY, { [String(num)]: entry });
        return res.status(200).json({ ok: true });
      }

      if (action === "available") {
        await kv.hdel(HASH_KEY, String(num));
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "Ação inválida." });
    }

    if (req.method === "DELETE") {
      // Limpa TODAS as reservas (usado pelo botão "Limpar todas as reservas").
      const { password } = req.body || {};

      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Senha do organizador inválida." });
      }

      await kv.del(HASH_KEY);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno." });
  }
};
