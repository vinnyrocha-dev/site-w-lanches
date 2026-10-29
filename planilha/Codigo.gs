// Planilha de pedidos da W Lanches.
// Recebe cada pedido enviado pelo site (função salvarNaPlanilha em lanchonete/index.html)
// e grava nas abas "Pedidos" e "Itens". A aba "Relatório" soma só os pedidos marcados como Confirmado.
//
// Instalação: cole este arquivo em Extensões → Apps Script da planilha, rode "configurar" uma vez
// e implante como App da Web (Executar como: eu; Quem pode acessar: qualquer pessoa).

const FUSO = 'America/Sao_Paulo';
const PEDIDOS = ['Data', 'Hora', 'Nº pedido', 'Cliente', 'Recebimento', 'Endereço', 'Itens', 'Subtotal', 'Entrega', 'Total', 'Pagamento', 'Troco', 'Confirmado', 'ID'];
const ITENS = ['Data', 'Nº pedido', 'Item', 'Qtd', 'Valor', 'ID', 'Confirmado'];

// O site envia um texto JSON. Tudo que vem de fora é limitado em tamanho e tipo antes de entrar na planilha.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = lerPedido(JSON.parse(e.postData.contents));
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const agora = new Date();
    const dia = new Date(Utilities.formatDate(agora, FUSO, "yyyy-MM-dd'T'00:00:00"));
    const hora = Utilities.formatDate(agora, FUSO, 'HH:mm');
    const id = String(agora.getTime()) + '-' + p.num;

    const resumo = p.itens.map(i => i.qtd + 'x ' + i.detalhe + (i.extras ? ' (' + i.extras + ')' : '') + (i.obs ? ' – Obs.: ' + i.obs : '')).join('\n');
    const entrega = p.recebimento === 'Entrega' ? (p.taxaCombinar ? 'a combinar' : p.taxa) : '';
    const endereco = p.recebimento === 'Entrega' ? p.endereco + (p.km !== '' ? ' (' + p.km + ' km)' : '') : '';
    ss.getSheetByName('Pedidos').appendRow([dia, hora, p.num, p.cliente, p.recebimento, endereco, resumo,
      p.subtotal, entrega, p.total, p.pagamento, p.troco, false, id]);

    const abaItens = ss.getSheetByName('Itens');
    const linha = abaItens.getLastRow() + 1;
    const linhas = p.itens.map((i, k) => [dia, p.num, i.item, i.qtd, i.valor, id,
      '=IFERROR(INDEX(Pedidos!M:M,MATCH(F' + (linha + k) + ',Pedidos!N:N,0)),FALSE)']);
    abaItens.getRange(linha, 1, linhas.length, ITENS.length).setValues(linhas);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('erro: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

function lerPedido(d) {
  const texto = (v, max) => String(v == null ? '' : v).replace(/^[=+\-@]+/, '').slice(0, max); // tira "=" do começo: ninguém injeta fórmula
  const numero = v => { const n = Number(v); if (!isFinite(n) || n < 0 || n > 100000) throw new Error('valor inválido'); return Math.round(n * 100) / 100; };
  if (!d || !Array.isArray(d.itens) || !d.itens.length || d.itens.length > 60) throw new Error('pedido sem itens');
  return {
    num: texto(d.num, 6),
    cliente: texto(d.cliente, 60),
    recebimento: d.recebimento === 'Entrega' ? 'Entrega' : 'Retirada',
    endereco: texto(d.endereco, 150),
    km: d.km === '' || d.km == null ? '' : numero(d.km),
    taxaCombinar: !!d.taxaCombinar,
    pagamento: texto(d.pagamento, 30),
    troco: texto(d.troco, 10),
    subtotal: numero(d.subtotal),
    taxa: numero(d.taxa || 0),
    total: numero(d.total),
    itens: d.itens.map(i => ({
      item: texto(i.item, 80), detalhe: texto(i.detalhe, 160), extras: texto(i.extras, 200), obs: texto(i.obs, 200),
      qtd: Math.max(1, Math.min(99, Math.floor(numero(i.qtd)))), valor: numero(i.valor),
    })),
  };
}

// Rode uma vez: cria as abas, os títulos e o relatório.
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(FUSO);
  const aba = (nome, titulos) => {
    const sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    sh.getRange(1, 1, 1, titulos.length).setValues([titulos]).setFontWeight('bold').setBackground('#ffc928');
    sh.setFrozenRows(1);
    return sh;
  };
  const ped = aba('Pedidos', PEDIDOS);
  ped.getRange('A2:A').setNumberFormat('dd/MM/yyyy');
  ped.getRange('H2:J').setNumberFormat('R$ #,##0.00');
  ped.getRange('M2:M').insertCheckboxes();
  ped.getRange('G2:G').setWrap(true);
  ped.hideColumns(14);
  const it = aba('Itens', ITENS);
  it.getRange('A2:A').setNumberFormat('dd/MM/yyyy');
  it.getRange('E2:E').setNumberFormat('R$ #,##0.00');
  it.hideColumns(6);

  const rel = ss.getSheetByName('Relatório') || ss.insertSheet('Relatório', 0);
  rel.clear();
  const conf = 'Pedidos!M:M,TRUE';
  const inicioSemana = 'TODAY()-WEEKDAY(TODAY(),2)+1';
  const inicioMes = 'DATE(YEAR(TODAY()),MONTH(TODAY()),1)';
  rel.getRange('A1:C1').setValues([['Relatório (só pedidos confirmados)', '', '']]).setFontWeight('bold');
  rel.getRange('A3:C3').setValues([['', 'Vendas (R$)', 'Pedidos']]).setFontWeight('bold');
  rel.getRange('A4:C7').setValues([
    ['Hoje', '=SUMIFS(Pedidos!J:J,Pedidos!A:A,TODAY(),' + conf + ')', '=COUNTIFS(Pedidos!A:A,TODAY(),' + conf + ')'],
    ['Esta semana', '=SUMIFS(Pedidos!J:J,Pedidos!A:A,">="&' + inicioSemana + ',' + conf + ')', '=COUNTIFS(Pedidos!A:A,">="&' + inicioSemana + ',' + conf + ')'],
    ['Este mês', '=SUMIFS(Pedidos!J:J,Pedidos!A:A,">="&' + inicioMes + ',' + conf + ')', '=COUNTIFS(Pedidos!A:A,">="&' + inicioMes + ',' + conf + ')'],
    ['Valor médio do pedido (mês)', '=IFERROR(B6/C6,0)', ''],
  ]);
  rel.getRange('B4:B7').setNumberFormat('R$ #,##0.00');
  rel.getRange('A9').setValue('Mais vendidos no mês').setFontWeight('bold');
  rel.getRange('A10').setFormula('=IFERROR(QUERY(Itens!A:G,"select C, sum(D), sum(E) where G = true and A >= date \'"&TEXT(' + inicioMes +
    ',"yyyy-mm-dd")&"\' group by C order by sum(D) desc limit 10 label C \'Item\', sum(D) \'Qtd\', sum(E) \'Valor\'",1),"Nenhuma venda confirmada no mês")');
  rel.setColumnWidth(1, 230);
  const sobra = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (sobra && ss.getSheets().length > 3) ss.deleteSheet(sobra);
}
