# Guia de Implementacao — CalorCheck

Este documento explica como rodar o CalorCheck no seu proprio servidor (VPS, servidor dedicado, ou computador local).

---

## Pre-requisitos

| Ferramenta | Versao minima | Como instalar |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 10+ | `npm install -g pnpm` |
| PostgreSQL | 14+ | https://www.postgresql.org |
| Git | qualquer | https://git-scm.com |

---

## 1. Copiar o projeto

```bash
git clone <URL_DO_SEU_REPOSITORIO> calorcheck
cd calorcheck
```

---

## 2. Instalar dependencias

```bash
pnpm install
```

---

## 3. Criar o banco de dados PostgreSQL

Acesse o PostgreSQL e crie um banco:

```sql
CREATE DATABASE calorcheck;
CREATE USER caloruser WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE calorcheck TO caloruser;
```

---

## 4. Configurar variaveis de ambiente

Crie o arquivo `.env` na pasta `artifacts/api-server/`:

```env
# Banco de dados
DATABASE_URL=postgresql://caloruser:sua_senha_segura@localhost:5432/calorcheck

# Sessao (gere uma string aleatoria longa e segura)
SESSION_SECRET=coloque_aqui_uma_string_muito_longa_e_aleatoria_de_pelo_menos_32_chars

# Porta do servidor (opcional, padrao 8080)
PORT=8080

# Armazenamento de fotos de receitas (opcional)
# Se nao configurado, upload de fotos nao funcionara
# DEFAULT_OBJECT_STORAGE_BUCKET_ID=seu_bucket_gcs
# PRIVATE_OBJECT_DIR=private
```

> **Dica:** Para gerar um SESSION_SECRET seguro, rode no terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 5. Criar as tabelas no banco de dados

```bash
pnpm --filter @workspace/db run push
```

Isso criara automaticamente todas as tabelas necessarias:
- `users` (usuarios com perfil e meta calórica)
- `food_entries` (registros de alimentos)
- `recipes` (receitas)
- `settings` (configuracoes)
- `user_sessions` (sessoes de login)

---

## 6. Compilar o frontend (interface)

```bash
pnpm --filter @workspace/calorie-tracker run build
```

Os arquivos compilados ficam em `artifacts/calorie-tracker/dist/`.

---

## 7. Servir o frontend pelo servidor API

Adicione o seguinte no arquivo `artifacts/api-server/src/app.ts`, logo antes de `app.use("/api", router)`:

```typescript
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = path.resolve(__dirname, "../../calorie-tracker/dist/public");

app.use(express.static(frontendPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
```

> **Alternativa:** Usar nginx para servir os arquivos estaticos (ver secao 10).

---

## 8. Compilar o servidor API

```bash
pnpm --filter @workspace/api-server run build
```

---

## 9. Iniciar o servidor em producao

```bash
cd artifacts/api-server
NODE_ENV=production node --enable-source-maps ./dist/index.mjs
```

O servidor estara acessivel em `http://seu-ip:8080`.

---

## 10. (Recomendado) Usar nginx como proxy reverso

Instale o nginx e crie o arquivo `/etc/nginx/sites-available/calorcheck`:

```nginx
server {
    listen 80;
    server_name seudominio.com.br;

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Cookie $http_cookie;
    }

    location / {
        root /home/usuario/calorcheck/artifacts/calorie-tracker/dist/public;
        try_files $uri $uri/ /index.html;
    }
}
```

Ative o site e reinicie o nginx:

```bash
sudo ln -s /etc/nginx/sites-available/calorcheck /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 11. (Recomendado) Manter o servidor rodando com PM2

```bash
npm install -g pm2

# Iniciar o servidor
cd artifacts/api-server
pm2 start "node --enable-source-maps ./dist/index.mjs" --name calorcheck-api

# Salvar para reiniciar automaticamente
pm2 save
pm2 startup
```

---

## 12. Configurar HTTPS com Let's Encrypt (dominio proprio)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br
```

---

## Estrutura das variaveis de ambiente necessarias

| Variavel | Obrigatório | Descricao |
|---|---|---|
| `DATABASE_URL` | Sim | Conexao com o PostgreSQL |
| `SESSION_SECRET` | Sim | Chave secreta para criptografar sessoes |
| `PORT` | Nao (padrao 8080) | Porta do servidor API |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Nao | ID do bucket GCS para fotos de receitas |
| `PRIVATE_OBJECT_DIR` | Nao | Diretório privado no bucket GCS |

---

## Upload de fotos de receitas (opcional)

Para habilitar o upload de fotos, voce precisa de uma conta no Google Cloud Storage:

1. Crie um projeto no Google Cloud Console
2. Crie um bucket GCS
3. Crie uma Service Account com permissao de leitura/escrita no bucket
4. Baixe o arquivo JSON de credenciais
5. Configure a variavel `GOOGLE_APPLICATION_CREDENTIALS` apontando para o JSON
6. Configure `DEFAULT_OBJECT_STORAGE_BUCKET_ID` com o nome do bucket

Se nao quiser configurar o GCS, o app funciona normalmente — apenas o upload de fotos ficara desabilitado.

---

## Resumo rapido (VPS Ubuntu/Debian)

```bash
# 1. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm pm2

# 2. Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser --pwprompt caloruser
sudo -u postgres createdb -O caloruser calorcheck

# 3. Clonar e instalar
git clone <URL_DO_REPO> calorcheck && cd calorcheck
pnpm install

# 4. Configurar .env em artifacts/api-server/.env
# (editar o arquivo com os valores corretos)

# 5. Criar tabelas
pnpm --filter @workspace/db run push

# 6. Compilar
pnpm --filter @workspace/calorie-tracker run build
pnpm --filter @workspace/api-server run build

# 7. Iniciar com PM2
cd artifacts/api-server
pm2 start "node ./dist/index.mjs" --name calorcheck-api
pm2 save && pm2 startup
```
