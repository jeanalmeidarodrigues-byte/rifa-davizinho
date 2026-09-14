// Senha do organizador. Pode ser sobrescrita definindo a variável de ambiente
// ADMIN_PASSWORD nas configurações do projeto na Vercel, sem precisar mexer no código.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "563200";

function checkAdminPassword(password) {
  return typeof password === "string" && password.length > 0 && password === ADMIN_PASSWORD;
}

module.exports = { checkAdminPassword, ADMIN_PASSWORD };
