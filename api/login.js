const { checkAdminPassword } = require("./_lib/auth");

// Endpoint só para validar a senha do organizador antes do navegador
// liberar o painel. A senha nunca fica escrita no HTML/JS do site.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { password } = req.body || {};

  if (!checkAdminPassword(password)) {
    return res.status(401).json({ error: "Senha incorreta." });
  }

  return res.status(200).json({ ok: true });
};
