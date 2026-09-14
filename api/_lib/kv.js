const { createClient } = require("@vercel/kv");

// Aceita tanto as variáveis padrão do Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN)
// quanto as geradas pela integração Upstash conectada via Marketplace da Vercel
// (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN), ou variações com prefixo
// customizado, caso a Vercel gere assim ao conectar o banco. Assim o site
// funciona sem precisar saber o nome exato da variável.
function findEnv(candidates) {
  for (const name of candidates) {
    if (process.env[name]) return process.env[name];
  }
  // Procura qualquer variável que termine com o sufixo esperado
  // (cobre nomes com prefixo customizado que a Vercel às vezes cria).
  const suffix = candidates[candidates.length - 1];
  const key = Object.keys(process.env).find(k => k.endsWith(suffix));
  return key ? process.env[key] : undefined;
}

let cachedClient = null;

// A conexão só é montada na primeira vez que algum endpoint realmente
// tenta usar o banco. Assim, se as variáveis ainda não estiverem
// configuradas, o erro é lançado dentro do try/catch de cada endpoint
// e retorna uma mensagem clara em JSON, em vez de derrubar a função inteira.
function getKv() {
  if (cachedClient) return cachedClient;

  const url = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
  const token = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);

  if (!url || !token) {
    throw new Error(
      "Banco de dados não conectado a este projeto na Vercel. " +
      "Vá em Storage > Connect Database, crie/conecte um banco (Upstash Redis) " +
      "a este projeto e faça um novo deploy."
    );
  }

  cachedClient = createClient({ url, token });
  return cachedClient;
}

// Proxy para manter a mesma forma de uso (kv.hgetall, kv.set, etc.)
// usada em todos os outros arquivos, sem precisar mudar mais nada neles.
const kv = new Proxy(
  {},
  {
    get(_target, prop) {
      return (...args) => getKv()[prop](...args);
    }
  }
);

module.exports = { kv };
