# Site W Lanches

Site de pedidos da W Lanches (Belford Roxo – RJ).

- `lanchonete/` — o site (é esta pasta que sobe no Cloudflare)
- `lanchonete/nota.html` — página de impressão da notinha (Epson TM-T20X)
- `W-Lanches-como-imprimir-a-notinha.pdf` — instruções da impressora para a loja

No ar em: https://wlanches.viniciusdev.workers.dev

## Registrar e imprimir pedidos recebidos pelo WhatsApp

1. Na planilha da loja, abra **Extensões → Apps Script** e atualize o arquivo de código com `planilha/Codigo.gs`.
2. No editor, crie ou atualize um arquivo HTML chamado `nota` e cole o conteúdo de `lanchonete/nota.html`.
3. Execute `vincularPlanilha` se as abas **Pedidos** e **Itens** já existirem. Em uma planilha nova, execute `configurar`.
4. Implante como **App da Web**. Para uma conta operadora, selecione **Executar como eu** e **Somente eu**. Se a equipe usar contas próprias, execute como **usuário que acessa o app**, exija login Google e conceda edição da planilha somente a quem registra pedidos. Nunca dê acesso anônimo. Arquive qualquer implantação anterior que aceite gravações públicas.
5. A equipe abre o endereço da implantação do Apps Script, cola a mensagem recebida, confere a prévia e clica em **Registrar pedido**. Após a confirmação, clique em **Imprimir nota**. No navegador público, `nota.html` oferece apenas impressão.

Cada registro novo começa como **Pendente**. Marque **Pago** ao confirmar o pagamento ou **Cancelado** se o pedido for cancelado. Para conferir a instalação, registre um pedido fictício, cole a mesma mensagem novamente e verifique que aparece apenas uma linha na aba **Pedidos**. Depois confira a impressão no computador da loja.
