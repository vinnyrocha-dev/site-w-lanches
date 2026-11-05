// Planilha de pedidos da W Lanches.
// Recebe cada pedido enviado pelo site (função salvarNaPlanilha em lanchonete/index.html)
// e grava nas abas "Pedidos" e "Itens" com status Pendente. A loja troca o status para Pago ou Cancelado
// na lista da coluna Status; a aba "Relatório" soma só os pedidos Pagos.
//
// Instalação: cole este arquivo em Extensões → Apps Script da planilha, rode "configurar" uma vez
// e implante como App da Web (Executar como: eu; Quem pode acessar: qualquer pessoa).

const FUSO = 'America/Sao_Paulo';
const PEDIDOS = ['Data', 'Hora', 'Nº pedido', 'Cliente', 'Recebimento', 'Endereço', 'Itens', 'Subtotal', 'Entrega', 'Total', 'Pagamento', 'Troco', 'Status', 'ID'];
const ITENS = ['Data', 'Nº pedido', 'Item', 'Qtd', 'Valor', 'ID'];
const STATUS = ['Pendente', 'Pago', 'Cancelado'];

// Rode uma vez: cria as abas, os títulos e o relatório. Pode rodar de novo: não apaga os pedidos.
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(FUSO);
  montarPedidos(ss);
  montarItens(ss);
  montarRelatorio(ss);
  const sobra = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (sobra) ss.deleteSheet(sobra);
}

const COR = { preto: '#14120f', amarelo: '#ffc928', creme: '#f6f3ec', linha: '#e6e0d4', texto: '#1a1815', suave: '#6b655b', branco: '#ffffff' };
const REAL = 'R$ #,##0.00';

function tabela(ss, nome, titulos, larguras) {
  const sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
  const n = titulos.length;
  sh.getBandings().forEach(b => b.remove());
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, 1, n).setValues([titulos]).setBackground(COR.preto).setFontColor(COR.amarelo).setFontWeight('bold')
    .setVerticalAlignment('middle').setHorizontalAlignment('center');
  sh.setRowHeight(1, 36);
  sh.setFrozenRows(1);
  sh.setHiddenGridlines(true);
  larguras.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  const corpo = sh.getRange(1, 1, sh.getMaxRows(), n);
  corpo.setFontFamily('Arial').setFontSize(10);
  sh.getRange(2, 1, sh.getMaxRows() - 1, n).setVerticalAlignment('middle').setFontColor(COR.texto);
  corpo.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(COR.preto).setFirstRowColor(COR.branco).setSecondRowColor('#faf7f0');
  corpo.createFilter();
  return sh;
}

function montarPedidos(ss) {
  const sh = tabela(ss, 'Pedidos', PEDIDOS.slice(0, 13), [90, 60, 85, 170, 105, 250, 340, 95, 95, 100, 105, 75, 115]);
  sh.getRange(1, 14).setValue('ID');
  sh.hideColumns(14);
  sh.setTabColor(COR.amarelo);
  sh.getRange('A2:A').setNumberFormat('dd/MM/yyyy');
  sh.getRange('H2:J').setNumberFormat(REAL);
  sh.getRange('J2:J').setFontWeight('bold');
  ['A2:C', 'E2:E', 'K2:M'].forEach(r => sh.getRange(r).setHorizontalAlignment('center'));
  sh.getRange('F2:G').setWrap(true);
  const status = sh.getRange('M2:M');
  status.setFontWeight('bold').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build());
  const cor = (texto, fundo, letra) => SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(texto).setBackground(fundo).setFontColor(letra).setRanges([status]).build();
  sh.setConditionalFormatRules([cor('Pendente', '#fff3c4', '#7a5b00'), cor('Pago', '#c8f0d2', '#14632f'), cor('Cancelado', '#f8c9c4', '#8f1d14')]);
}

function montarItens(ss) {
  const sh = tabela(ss, 'Itens', ITENS.slice(0, 5), [90, 85, 300, 60, 100]);
  sh.getRange(1, 6).setValue('ID');
  sh.getRange('G:G').clear();
  sh.hideColumns(6);
  sh.getRange('A2:A').setNumberFormat('dd/MM/yyyy');
  sh.getRange('E2:E').setNumberFormat(REAL);
  ['A2:B', 'D2:D'].forEach(r => sh.getRange(r).setHorizontalAlignment('center'));
}

function montarRelatorio(ss) {
  const sh = ss.getSheetByName('Relatório') || ss.insertSheet('Relatório', 0);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  sh.setHiddenGridlines(true);
  sh.setTabColor(COR.preto);
  if (sh.getMaxColumns() > 6) sh.deleteColumns(7, sh.getMaxColumns() - 6);
  if (sh.getMaxRows() > 26) sh.deleteRows(27, sh.getMaxRows() - 26);
  [24, 190, 190, 190, 190, 24].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange('A1:F26').setFontFamily('Arial').setFontColor(COR.texto).setVerticalAlignment('middle');

  // Cabeçalho
  sh.getRange('A1:F2').setBackground(COR.preto);
  sh.setRowHeight(1, 46);
  sh.setRowHeight(2, 26);
  sh.getRange('B1').setValue('W LANCHES').setFontColor(COR.amarelo).setFontSize(22).setFontWeight('bold');
  sh.getRange('B2').setValue('Relatório de vendas  ·  conta só os pedidos com status Pago').setFontColor(COR.branco).setFontSize(10);
  [3, 7, 9].forEach(l => sh.setRowHeight(l, 14));

  // Cartões
  const SOLIDA = SpreadsheetApp.BorderStyle.SOLID_THICK;
  [['B', 'HOJE'], ['C', 'ESTA SEMANA'], ['D', 'ESTE MÊS'], ['E', 'VALOR MÉDIO (MÊS)']].forEach(([c, titulo]) => {
    const cartao = sh.getRange(c + '4:' + c + '6').setBackground(COR.creme).setHorizontalAlignment('center');
    cartao.setBorder(null, true, null, true, false, false, COR.branco, SOLIDA);
    sh.getRange(c + '4').setValue(titulo).setFontSize(9).setFontWeight('bold').setFontColor(COR.suave)
      .setBorder(true, null, null, null, null, null, COR.amarelo, SOLIDA);
    sh.getRange(c + '5').setFontSize(20).setFontWeight('bold').setNumberFormat(REAL);
    sh.getRange(c + '6').setFontSize(9).setFontColor(COR.suave);
  });
  sh.setRowHeight(4, 30);
  sh.setRowHeight(5, 42);
  sh.setRowHeight(6, 26);

  // Pendentes e cancelados
  sh.getRange('B8:C8').setBackground('#fff3c4').setFontColor('#7a5b00').setFontWeight('bold');
  sh.getRange('D8:E8').setBackground('#f8c9c4').setFontColor('#8f1d14').setFontWeight('bold');
  sh.getRange('B8').setValue('Pedidos pendentes');
  sh.getRange('D8').setValue('Cancelados no mês');
  sh.getRange('C8').setHorizontalAlignment('right');
  sh.getRange('E8').setHorizontalAlignment('right');
  sh.setRowHeight(8, 30);

  // Mais vendidos
  sh.getRange('B10').setValue('MAIS VENDIDOS DO MÊS').setFontSize(11).setFontWeight('bold');
  sh.setRowHeight(10, 28);
  sh.getRange('B11:D11').setValues([['Item', 'Quantidade', 'Valor']]).setBackground(COR.preto).setFontColor(COR.amarelo).setFontWeight('bold');
  sh.setRowHeight(11, 30);
  sh.getRange('C11:C21').setHorizontalAlignment('center');
  sh.getRange('D11:D21').setHorizontalAlignment('right');
  sh.getRange('D12:D21').setNumberFormat(REAL);
  sh.getRange('B12:D21').setBorder(null, null, true, null, null, true, COR.linha, SpreadsheetApp.BorderStyle.SOLID);

  // O script escreve fórmulas no padrão en_US (vírgula). Em planilha pt_BR isso dá "Formula parse error",
  // então troca o idioma só enquanto grava: o Google guarda a fórmula e depois mostra com ponto e vírgula.
  const idioma = ss.getSpreadsheetLocale();
  ss.setSpreadsheetLocale('en_US');
  SpreadsheetApp.flush();
  const pago = 'Pedidos!M:M,"Pago"';
  const semana = '">="&(TODAY()-WEEKDAY(TODAY(),2)+1)';
  const mes = '">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1)';
  const soma = criterio => '=SUMIFS(Pedidos!J:J,Pedidos!A:A,' + criterio + ',' + pago + ')';
  const conta = criterio => '=COUNTIFS(Pedidos!A:A,' + criterio + ',' + pago + ')&IF(COUNTIFS(Pedidos!A:A,' + criterio + ',' + pago + ')=1," pedido"," pedidos")';
  sh.getRange('B5').setFormula(soma('TODAY()'));
  sh.getRange('B6').setFormula(conta('TODAY()'));
  sh.getRange('C5').setFormula(soma(semana));
  sh.getRange('C6').setFormula(conta(semana));
  sh.getRange('D5').setFormula(soma(mes));
  sh.getRange('D6').setFormula(conta(mes));
  sh.getRange('E5').setFormula('=IFERROR(D5/COUNTIFS(Pedidos!A:A,' + mes + ',' + pago + '),0)');
  sh.getRange('E6').setValue('por pedido pago');
  sh.getRange('C8').setFormula('=COUNTIF(Pedidos!M:M,"Pendente")');
  sh.getRange('E8').setFormula('=COUNTIFS(Pedidos!A:A,' + mes + ',Pedidos!M:M,"Cancelado")');
  // O status fica só em Pedidos; aqui ele é buscado pelo ID de cada item. A data vai montada à mão porque TEXT() muda com o idioma.
  sh.getRange('B12').setFormula('=IFERROR(QUERY({Itens!A2:E,ARRAYFORMULA(IFERROR(VLOOKUP(Itens!F2:F,{Pedidos!N2:N,Pedidos!M2:M},2,FALSE),""))},' +
    '"select Col3, sum(Col4), sum(Col5) where Col6 = \'Pago\' and Col1 >= date \'"&YEAR(TODAY())&"-"&RIGHT("0"&MONTH(TODAY()),2)&"-01\' ' +
    'group by Col3 order by sum(Col4) desc limit 10 label sum(Col4) \'\', sum(Col5) \'\'",0),"Nenhuma venda paga no mês")');
  SpreadsheetApp.flush();
  ss.setSpreadsheetLocale(idioma);
}

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
      p.subtotal, entrega, p.total, p.pagamento, p.troco, 'Pendente', id]);

    const abaItens = ss.getSheetByName('Itens');
    const linhas = p.itens.map(i => [dia, p.num, i.item, i.qtd, i.valor, id]);
    abaItens.getRange(abaItens.getLastRow() + 1, 1, linhas.length, ITENS.length).setValues(linhas);
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
