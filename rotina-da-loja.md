# Rotina da loja – W Lanches

Checklist para a equipe e para a dona. As partes automáticas (limpeza de 90 dias e cópias de segurança da planilha) já estão no script da planilha.

## 1. Antes de aceitar cada pedido (todo pedido)

O cliente monta o pedido no site, mas a mensagem passa pelo WhatsApp dele e pode ser alterada. Antes de confirmar:

- [ ] **Itens e preços**: confira na tela da notinha se cada item e preço bate com o cardápio do site.
- [ ] **Total**: confira se o total é a soma dos itens mais a entrega.
- [ ] **Taxa de entrega**: R$ 4 por km, arredondando o km para cima. Se veio "a combinar", calcule e informe o valor ao cliente pelo WhatsApp.
- [ ] **Endereço e localização**: confira se o link do mapa bate com o endereço digitado. Se não bater, pergunte ao cliente.
- [ ] **Confirme pelo WhatsApp** o total final e o tempo de preparo. O pedido só vale depois dessa confirmação.
- [ ] Registre na página de pedidos e imprima a nota.
- [ ] Na planilha, marque **Pago** quando receber, ou **Cancelado** se o cliente desistir.

## 2. Contas protegidas (uma vez, e conferir a cada 3 meses)

- [ ] **Google da loja**: ative a verificação em duas etapas (myaccount.google.com → Segurança).
- [ ] **WhatsApp da loja**: ative a confirmação em duas etapas (Configurações → Conta → Confirmação em duas etapas) e cadastre um PIN.
- [ ] **WhatsApp – aparelhos conectados**: em Configurações → Aparelhos conectados, desconecte qualquer aparelho que não seja o computador da loja.
- [ ] **Cloudflare, GitHub e Google** de quem cuida do site: verificação em duas etapas ativada.
- [ ] Não compartilhe senhas pelo WhatsApp e não deixe o computador da loja destravado sem ninguém.

## 3. Guarda de dados por 90 dias

- [ ] **Planilha**: automático. Todo dia às 3h, os pedidos com mais de 90 dias perdem nome, endereço, observações e troco. Ficam só os valores e os itens, para o relatório.
- [ ] **Cópias de segurança**: automático. Uma cópia por semana, guardando só as 4 mais recentes.
- [ ] **WhatsApp**: ative as mensagens temporárias de **90 dias** como padrão para conversas novas (Configurações → Privacidade → Duração padrão das mensagens → 90 dias). Isso vale para conversas novas. Uma vez por mês, apague as conversas de pedido com mais de 90 dias que já existiam.
- [ ] **Notas impressas**: guarde só o necessário e descarte picotando ou rasgando as notas com mais de 90 dias.
- [ ] **Pedido de exclusão de um cliente** (pelo WhatsApp): apague a conversa, troque o nome e o endereço dele na aba Pedidos por "Anonimizado" e responda em até 15 dias.

## 4. Testar a recuperação do backup (a cada 3 meses)

- [ ] No Google Drive da loja, abra a pasta **Backups – Pedidos W Lanches**.
- [ ] Confira se há cópias recentes (uma por semana).
- [ ] Abra a mais recente e veja se as abas Pedidos, Itens e Relatório estão lá.
- [ ] Se a planilha principal se perder: faça uma cópia do backup mais recente, abra **Extensões → Apps Script**, execute **vincularPlanilha** e **ativarBackup**, e crie uma nova implantação do App da Web (Somente eu).

## 5. Quando mudar algo no site

- [ ] Preço, item, horário ou condição de entrega: atualizar o site e subir no Cloudflare.
- [ ] Se mudar o uso de dados (por exemplo, um novo serviço), atualizar a Política de Privacidade e a data dela.
