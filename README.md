# Zona Morta: Sobrevivência Urbana - Como Rodar no seu PC

Este projeto é uma aplicação web completa desenvolvida em React, TypeScript, Three.js e Vite. Você pode rodá-la e testá-la diretamente no seu computador sem precisar do site do AI Studio.

---

## 🚀 Passo a Passo Rápido

### Pré-requisito
Você só precisa ter o **Node.js** instalado no seu computador (versão 18, 20 ou superior).  
Caso ainda não tenha, baixe gratuitamente em: [https://nodejs.org](https://nodejs.org) (versão LTS recomendada).

---

### Passo 1: Baixar os arquivos para o seu PC
1. No menu superior direito do Google AI Studio, clique nos três pontinhos ou no ícone de opções (`...`).
2. Selecione **"Export to ZIP"** (ou **"Export to GitHub"**).
3. Salve o arquivo `.zip` e extraia os arquivos em uma pasta no seu computador (por exemplo: na Área de Trabalho ou em Documentos).

---

### Passo 2: Instalar as dependências
1. Abra o terminal (Prompt de Comando / PowerShell no Windows, ou Terminal no Mac/Linux).
2. Navegue até a pasta onde você extraiu o jogo:
   ```bash
   cd "caminho/para/a/pasta/do/jogo"
   ```
3. Execute o comando para baixar as bibliotecas necessárias:
   ```bash
   npm install
   ```
   *(Isso só precisa ser feito uma única vez)*.

---

### Passo 3: Iniciar e Jogar!
Para iniciar o jogo localmente com abertura automática do navegador:
```bash
npm run dev:open
```
Ou:
```bash
npm run dev
```
O terminal exibirá o endereço local, geralmente:
`http://localhost:3000`

Basta abrir esse endereço no seu navegador favorito (Chrome, Edge, Firefox, Brave) e o jogo estará rodando 100% nativo na sua máquina!

---

## ⚡ Como gerar a versão de produção (Mais leve e rápida)

Se quiser a versão final compilada com máxima performance:
```bash
npm run build
npm run preview
```
Isso gera a pasta `dist/` otimizada com arquivos estáticos e abre um servidor ultrarrápido no seu PC.
