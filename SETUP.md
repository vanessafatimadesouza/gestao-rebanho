# Gestão de Rebanho — Setup

## 1. Supabase (banco de dados)

1. Crie conta gratuita em https://supabase.com
2. Clique em **New project**, dê um nome e escolha a região (South America)
3. No painel, vá em **SQL Editor** → cole todo o conteúdo de `supabase/schema.sql` → **Run**
4. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public` key

## 2. Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

## 3. Instalar e rodar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:5173

## 4. Deploy no Vercel (gratuito, sincronizado)

1. Crie conta em https://vercel.com
2. Conecte seu repositório GitHub
3. Em **Environment Variables** no Vercel, adicione as mesmas variáveis do `.env`
4. Deploy automático a cada push no GitHub

## 5. Compartilhar com outros usuários

- Cada usuário faz login/cadastro normalmente
- O primeiro usuário cria a fazenda
- No Dashboard, clique em **Código da fazenda** para copiar
- Compartilhe o código via WhatsApp com os outros
- Os outros entram em "Configurar fazenda" → "Entrar com código"

## Funcionalidades do MVP

- Cadastro e login de usuários
- Criar/entrar em fazenda (multi-usuário)
- Cadastro de animais (brinco, nome, sexo, raça, mãe, pai)
- Registro de vacinas com alerta de próxima dose
- Registro de partos (com cadastro automático da cria)
- Eventos: pesagem, tratamento, venda, compra
- Dashboard com alertas de vacinas a vencer
- Responsivo (celular e computador)
- Dados sincronizados em tempo real via Supabase
