# Site W Lanches

Site de pedidos da W Lanches (Belford Roxo – RJ).

- `lanchonete/` — o site (é esta pasta que sobe no Cloudflare)
- `lanchonete/nota.html` — página de impressão da notinha (Epson TM-T20X)
- `lanchonete/privacidade.html` e `lanchonete/termos.html` — Política de Privacidade (LGPD) e Termos de Uso
- `lanchonete/_headers` — cabeçalhos de segurança aplicados pelo Cloudflare (HTTPS, CSP, anti-clickjacking)
- `W-Lanches-como-imprimir-a-notinha.pdf` — instruções da impressora para a loja

No ar em: https://wlanches.viniciusdev.workers.dev

## Registrar e imprimir pedidos recebidos pelo WhatsApp

1. Na planilha da loja, abra **Extensões → Apps Script** e atualize o arquivo de código com `planilha/Codigo.gs`.
2. No editor, crie ou atualize um arquivo HTML chamado `nota` e cole o conteúdo de `lanchonete/nota.html`.
3. Execute `vincularPlanilha` se as abas **Pedidos** e **Itens** já existirem. Em uma planilha nova, execute `configurar`.
4. Implante como **App da Web**. Para uma conta operadora, selecione **Executar como eu** e **Somente eu**. Se a equipe usar contas próprias, execute como **usuário que acessa o app**, exija login Google e conceda edição da planilha somente a quem registra pedidos. Nunca dê acesso anônimo. Arquive qualquer implantação anterior que aceite gravações públicas.
5. A equipe abre o endereço da implantação do Apps Script, cola a mensagem recebida, confere a prévia e clica em **Registrar pedido**. Após a confirmação, clique em **Imprimir nota**. No navegador público, `nota.html` oferece apenas impressão.

Cada registro novo começa como **Pendente**. Marque **Pago** ao confirmar o pagamento ou **Cancelado** se o pedido for cancelado. Para conferir a instalação, registre um pedido fictício, cole a mesma mensagem novamente e verifique que aparece apenas uma linha na aba **Pedidos**. Depois confira a impressão no computador da loja.

## Backup da planilha

Na planilha da loja, em **Extensões → Apps Script**, execute `ativarBackup` uma vez. Ele faz uma cópia na hora e, depois, toda segunda-feira às 4h, na pasta **Backups – Pedidos W Lanches** do Drive da loja, guardando as 4 cópias mais recentes. Também agenda a limpeza diária (3h) que anonimiza os dados pessoais de pedidos com mais de 90 dias. Rotina da equipe: `rotina-da-loja.md`. O código do site tem cópia no GitHub.

## Segurança

- O site só tem arquivos estáticos (sem servidor, banco de dados ou bibliotecas externas): não há dependências para atualizar. A fonte é servida pelo próprio site.
- HTTPS: o Cloudflare serve em HTTPS; quem abrir em `http://` é levado para `https://`, e o cabeçalho HSTS faz o navegador lembrar disso.
- Firewall: o Cloudflare protege contra ataques de tráfego (DDoS) automaticamente. Regras de WAF configuráveis exigem domínio próprio no Cloudflare.
