# Rifa Solidária do Davizinho — versão Vercel (sem Firebase)

Este pacote já vem pronto para publicar na **Vercel**, sem depender do Firebase.
Os dados (reservas, número sorteado, fotos, título do site etc.) agora ficam
guardados no **Vercel KV** (um banco de dados chave-valor da própria Vercel),
acessado através de funções serverless na pasta `api/`.

## O que foi corrigido/melhorado nesta versão

1. **Segurança do painel do organizador**: as ações administrativas (marcar
   pago, liberar número, definir vencedor, editar título/prêmios, limpar
   reservas) agora são validadas **no servidor** (dentro de `api/*.js`),
   comparando a senha enviada com a senha do organizador. Antes, a proteção
   existia só no JavaScript do navegador e podia ser contornada pelo console
   do navegador.
2. **Senha do organizador**: trocada pela senha fixa de 6 dígitos `563200`
   (veja como alterar mais abaixo). Não há mais cadastro de e-mail/senha nem
   fluxo de "esqueci minha senha" — é só digitar a senha para entrar.
3. **XSS corrigido**: nome e WhatsApp digitados pelos participantes agora são
   escapados antes de aparecer na tabela do organizador, evitando que alguém
   injete HTML/script malicioso através do formulário de reserva.
4. **Reserva com verificação no servidor**: antes de gravar uma nova reserva,
   a API confere se o número já está reservado/pago, reduzindo (embora não
   elimine 100%) o risco de duas pessoas reservarem o mesmo número ao mesmo
   tempo.
5. **Limpeza de reservas expiradas feita no servidor**: a cada consulta à
   lista de reservas, a própria API remove reservas "reservado" vencidas há
   mais de 10 minutos — não depende mais de alguém estar com o site aberto no
   navegador.
6. Todas as demais funcionalidades (grade de 100 números, filtros, busca,
   "meus números", compartilhar, exportar CSV, upload de fotos, prêmio 1 e 2,
   edição do título do site) foram mantidas exatamente como estavam.

### Limitação conhecida (trade-off ao sair do Firebase)

O Firebase Realtime Database atualizava a tela de todo mundo instantaneamente
("tempo real"). Funções serverless da Vercel não mantêm conexão aberta com o
navegador, então esta versão faz **polling**: o site consulta a API a cada
4 segundos para atualizar a grade. Na prática, a diferença é pequena (no
máximo alguns segundos de atraso), mas não é mais 100% instantâneo como antes.

## Passo a passo para publicar

### 1. Suba o projeto para a Vercel
Suba esta pasta inteira (mantendo a estrutura de arquivos) em um repositório
Git (GitHub/GitLab/Bitbucket) e importe o repositório na Vercel, **ou** use a
CLI da Vercel (`vercel deploy`) direto nesta pasta.

### 2. Ative um banco de dados (Vercel KV)
No painel do projeto na Vercel: **Storage → Create Database → KV (Redis)** e
conecte esse banco ao projeto. A Vercel adiciona automaticamente as variáveis
de ambiente necessárias (`KV_REST_API_URL`, `KV_REST_API_TOKEN` etc.) — não
precisa copiar nada manualmente.

> Se o nome "Vercel KV" não aparecer mais no seu painel, procure por
> **Marketplace Database Integrations → Upstash (Redis)** — é o mesmo serviço,
> apenas com um nome novo. O pacote `@vercel/kv` funciona com ele normalmente.

### 3. (Opcional) Troque a senha do organizador
A senha padrão já vem definida como `563200` direto no código
(`api/_lib/auth.js`). Se quiser trocá-la sem editar código, vá em
**Project Settings → Environment Variables** e crie:

```
ADMIN_PASSWORD = sua-nova-senha-de-6-digitos
```

Depois é só reimplantar (redeploy) o projeto.

### 4. Redeploy
Depois de conectar o banco (e, se quiser, configurar `ADMIN_PASSWORD`), faça
um novo deploy para garantir que as variáveis de ambiente sejam aplicadas.

Pronto — o site estará funcionando com os dados compartilhados entre todos os
visitantes, sem precisar de nenhuma conta ou configuração do Firebase.

## Estrutura de arquivos

```
index.html              → site (mesmo visual e funcionalidades de antes)
package.json            → dependência do @vercel/kv e versão do Node
api/
  login.js              → valida a senha do organizador
  reservas.js           → GET/POST/PUT/DELETE das reservas
  vencedor.js           → GET/POST/DELETE do número sorteado
  config.js             → GET/POST do título/subtítulo do site
  premio1.js            → GET/POST da foto e história do prêmio 1
  premio2fotos.js       → GET/POST/DELETE das fotos do prêmio 2
  fotos.js              → GET/POST/DELETE das fotos de cada número da rifa
  _lib/auth.js           → verificação da senha do organizador
```
