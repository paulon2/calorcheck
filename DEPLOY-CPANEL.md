# Manual de Implementação — CalorCheck no cPanel

## Visão Geral da Arquitetura

No cPanel, a aplicação funciona da seguinte forma:
- **Servidor API** (Node.js) → roda como app Node.js via cPanel
- **Frontend** (arquivos estáticos) → servido pelo próprio servidor Node.js ou por Apache
- **Banco de dados** → PostgreSQL externo gratuito (Neon.tech), pois a maioria dos cPanels usa MySQL

---

## Pré-requisitos no seu cPanel

Antes de começar, verifique se o seu plano de hospedagem possui:

1. **Setup Node.js App** — Procure no painel cPanel por "Setup Node.js App" ou "Node.js Selector"
2. **Acesso SSH** — Terminal via cPanel (seção "Terminal" ou SSH)
3. **Node.js 20+** — Selecionável no painel

> Se o seu cPanel não tiver "Setup Node.js App", entre em contato com a hospedagem e pergunte se Node.js está disponível no plano.

---

## Passo 1 — Criar banco de dados PostgreSQL gratuito (Neon.tech)

Como a maioria dos cPanels usa MySQL, vamos usar um PostgreSQL na nuvem gratuitamente.

1. Acesse **https://neon.tech** e crie uma conta gratuita
2. Clique em **"New Project"**
3. Escolha um nome para o projeto (ex: `calorcheck`)
4. Copie a **Connection String** que aparece — será parecida com:
   ```
   postgresql://usuario:senha@ep-xxxx.us-east-1.aws.neon.tech/calorcheck?sslmode=require
   ```
5. Guarde essa string — você vai precisar dela no Passo 4

---

## Passo 2 — Preparar o projeto no computador local

Você precisa ter o projeto rodando localmente para compilar. Se ainda não tem, clone o repositório e siga os passos abaixo.

### 2.1 — Instalar dependências

```bash
pnpm install
```

### 2.2 — Criar as tabelas no banco de dados

Configure a variável de ambiente com a string do Neon.tech e rode o push:

**No Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://usuario:senha@ep-xxxx.us-east-1.aws.neon.tech/calorcheck?sslmode=require"
pnpm --filter @workspace/db run push
```

**No Mac/Linux:**
```bash
DATABASE_URL="postgresql://usuario:senha@..." pnpm --filter @workspace/db run push
```

Você verá a mensagem `[✓] Changes applied` quando as tabelas forem criadas.

### 2.3 — Compilar o frontend

```bash
# Defina o caminho base como "/" para produção
BASE_PATH=/ pnpm --filter @workspace/calorie-tracker run build
```

Os arquivos compilados ficam em: `artifacts/calorie-tracker/dist/public/`

### 2.4 — Compilar o servidor API

```bash
pnpm --filter @workspace/api-server run build
```

Os arquivos compilados ficam em: `artifacts/api-server/dist/`

---

## Passo 3 — Preparar os arquivos para upload

Crie uma pasta chamada `calorcheck-deploy` com a seguinte estrutura:

```
calorcheck-deploy/
├── dist/                    ← Copiar de artifacts/api-server/dist/
├── public/                  ← Copiar de artifacts/calorie-tracker/dist/public/
├── node_modules/            ← Será criada no cPanel
└── package.json             ← Criar conforme instruções abaixo
```

**Crie o arquivo `calorcheck-deploy/package.json`:**

```json
{
  "name": "calorcheck",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.mjs",
  "scripts": {
    "start": "node --enable-source-maps dist/index.mjs"
  },
  "dependencies": {
    "@google-cloud/storage": "^7.19.0",
    "bcryptjs": "^3.0.2",
    "connect-pg-simple": "^10.0.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.44.2",
    "express": "^5.1.0",
    "express-session": "^1.18.1",
    "google-auth-library": "^10.6.2",
    "pg": "^8.16.0",
    "pino": "^9.7.0",
    "pino-http": "^10.4.0"
  }
}
```

> **Atenção:** Não copie a pasta `node_modules` do projeto de desenvolvimento. Ela será reinstalada no servidor.

---

## Passo 4 — Adicionar suporte a arquivos estáticos no servidor API

Para que o Node.js sirva o frontend junto com a API, adicione essas linhas no arquivo `artifacts/api-server/src/app.ts` **antes** de `app.use("/api", router)`:

```typescript
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "..", "public");

app.use(express.static(frontendDist));
```

E **após** `app.use("/api", router)`, adicione:

```typescript
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});
```

Depois recompile o servidor:

```bash
pnpm --filter @workspace/api-server run build
```

E copie novamente o conteúdo de `artifacts/api-server/dist/` para `calorcheck-deploy/dist/`.

---

## Passo 5 — Upload dos arquivos no cPanel

1. Acesse o **Gerenciador de Arquivos** no cPanel
2. Navegue até `/home/seuusuario/` (fora do `public_html`)
3. Crie uma pasta chamada `calorcheck`
4. Faça upload de todos os arquivos da pasta `calorcheck-deploy/` para dentro de `/home/seuusuario/calorcheck/`
   - Compacte em ZIP e use a opção "Extrair" no gerenciador, ou use FTP/SFTP

A estrutura final no servidor deve ser:
```
/home/seuusuario/calorcheck/
├── dist/
│   ├── index.mjs
│   └── ... (outros arquivos)
├── public/
│   ├── index.html
│   └── assets/
└── package.json
```

---

## Passo 6 — Configurar o App Node.js no cPanel

1. No cPanel, procure por **"Setup Node.js App"** e clique
2. Clique em **"Create Application"**
3. Preencha os campos:

| Campo | Valor |
|---|---|
| Node.js version | 20.x (a mais recente disponível) |
| Application mode | Production |
| Application root | `calorcheck` |
| Application URL | Escolha o domínio ou subdomínio (ex: `seudominio.com.br`) |
| Application startup file | `dist/index.mjs` |

4. Clique em **"Create"**

---

## Passo 7 — Configurar variáveis de ambiente

Ainda na tela do app Node.js no cPanel, role até a seção **"Environment variables"** e adicione:

| Nome da variável | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://usuario:senha@ep-xxxx.us-east-1.aws.neon.tech/calorcheck?sslmode=require` |
| `SESSION_SECRET` | Uma string longa e aleatória (ex: `k8f2m9p1q7n3r6s4t0u5v2w8x1y4z7a3b6c9d2e5f8g1h4i7j0`) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` (ou o que o cPanel configurar automaticamente) |

> Para gerar o SESSION_SECRET, use: https://generate-secret.vercel.app/64

---

## Passo 8 — Instalar dependências no servidor

1. Na tela do app Node.js no cPanel, clique em **"Run NPM Install"**
2. Aguarde a instalação terminar (pode demorar alguns minutos)

OU, se tiver acesso SSH:

```bash
cd ~/calorcheck
npm install --production
```

---

## Passo 9 — Iniciar o servidor

1. Na tela do app Node.js, clique em **"Start"** ou **"Restart"**
2. Aguarde alguns segundos
3. Acesse seu domínio no navegador — o app deve aparecer

---

## Passo 10 — Configurar .htaccess (se necessário)

Se o Apache estiver na frente do Node.js e as rotas não funcionarem, crie (ou edite) o arquivo `.htaccess` na raiz do domínio (`public_html`) com o seguinte conteúdo:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

> Substitua `3000` pela porta que o cPanel atribuiu ao seu app.

---

## Solução de Problemas Comuns

### ❌ "Cannot find module" ao iniciar

Verifique se o `npm install` foi executado corretamente na pasta do app.

### ❌ Banco de dados não conecta

- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que a string tem `?sslmode=require` no final (obrigatório no Neon.tech)
- Teste a conexão localmente antes

### ❌ App inicia mas dá erro 502/503

- Verifique nos logs do cPanel (seção "Error Logs") a mensagem de erro
- Confirme que o arquivo de inicialização está correto: `dist/index.mjs`
- Confirme que todas as variáveis de ambiente foram configuradas

### ❌ Páginas internas dão erro 404

Adicione o `.htaccess` conforme o Passo 10 para redirecionar todas as rotas para o Node.js.

### ❌ "Setup Node.js App" não aparece no cPanel

Seu plano de hospedagem pode não suportar Node.js. Nesse caso, considere:
- **Alternativa 1:** Solicitar upgrade para um plano que inclua Node.js
- **Alternativa 2:** Contratar uma VPS (DigitalOcean, Hostinger VPS, Contabo) e seguir o guia `DEPLOY.md`
- **Alternativa 3:** Hospedar gratuitamente no Render.com ou Railway.app

---

## Alternativas Gratuitas se o cPanel não suportar Node.js

| Plataforma | Gratuito | Node.js | PostgreSQL | Facilidade |
|---|---|---|---|---|
| **Render.com** | Sim (com limitações) | Sim | Sim (via Neon) | Muito fácil |
| **Railway.app** | Sim (créditos) | Sim | Sim | Fácil |
| **Fly.io** | Sim (com limitações) | Sim | Sim | Médio |
| **VPS Contabo** | Não (~R$20/mês) | Sim | Sim | Médio (usar DEPLOY.md) |

---

## Resumo Visual

```
SEU COMPUTADOR              CPANEL                    NEON.TECH
      │                        │                           │
      │  1. pnpm install        │                           │
      │  2. Criar tabelas ──────────────────────────────► PostgreSQL
      │  3. Build frontend      │                           │
      │  4. Build API           │                           │
      │  5. Upload arquivos ──► calorcheck/                 │
      │                        │  dist/                     │
      │                        │  public/                   │
      │                        │  package.json              │
      │                        │                           │
      │                        │  6. npm install            │
      │                        │  7. Configurar env vars    │
      │                        │  8. Start Node.js App      │
      │                        │         │                  │
USUÁRIO ◄───── Internet ◄──── Apache ◄── Node.js ◄────── DB │
```
