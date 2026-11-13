// Testa Codigo.gs com uma planilha simulada. Uso: node planilha/teste.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const abas = { Pedidos: [], Itens: [] }, formulas = [], idiomas = [];
const cadeia = new Proxy(function () {}, { get: (t, k) => k === 'setFormula' ? f => (formulas.push([idiomas.at(-1), f]), cadeia) : k === 'getMaxRows' ? () => 1000 : k === 'getMaxColumns' ? () => 26 : k === 'getBandings' ? () => [] : k === 'getFilter' ? () => null : () => cadeia, apply: () => cadeia });
const sheet = nome => (abas[nome] ? {
  appendRow: r => abas[nome].push(r), getLastRow: () => abas[nome].length + 1,
  getMaxRows: () => 1000,
  getRange: (_linha, coluna) => ({
    setValues: valores => abas[nome].push(...valores),
    createTextFinder: id => ({ matchEntireCell: () => ({ findNext: () => abas[nome].some(r => r[coluna - 1] === id) }) }),
  }),
} : null);
const planilha = { getSheetByName: sheet, setSpreadsheetLocale: l => idiomas.push(l), getSpreadsheetLocale: () => 'pt_BR', setSpreadsheetTimeZone() {} };
global.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
global.SpreadsheetApp = { openById: () => planilha, flush() {}, newDataValidation: () => cadeia, newConditionalFormatRule: () => cadeia, BandingTheme: {}, BorderStyle: {} };
global.Utilities = { formatDate: (d, tz, f) => f === 'HH:mm' ? '19:30' : '2026-11-5' };
global.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 'teste' }) };
global.Utilities.computeDigest = (_algoritmo, texto) => require('crypto').createHash('sha256').update(texto).digest();
global.Utilities.base64EncodeWebSafe = bytes => bytes.toString('base64url');
global.Utilities.DigestAlgorithm = { SHA_256: 'SHA_256' };
global.Utilities.Charset = { UTF_8: 'UTF_8' };
eval(fs.readFileSync(path.join(__dirname, 'Codigo.gs'), 'utf8') + '; global.registrarPedido = registrarPedido; global.montarRelatorio = montarRelatorio; global.montarPedidos = montarPedidos;');

const enviar = registrarPedido;
const pedido = { num: '1234', cliente: 'Maria', pagamento: 'Dinheiro', troco: '100', recebimento: 'Entrega', endereco: 'Rua A, 10', km: 3.4, taxaCombinar: false,
  itens: [{ item: 'Nº 7', detalhe: 'Nº 7 (Trio) + Bacon', extras: 'Molhos: Barbecue', obs: 'sem cebola', qtd: 2, valor: 66 }, { item: 'Guaravita', detalhe: 'Guaravita', extras: '', obs: '', qtd: 1, valor: 2 }],
  subtotal: 68, taxa: 16, total: 84 };
assert.strictEqual(enviar(pedido), 'ok');
assert.strictEqual(enviar(pedido), 'existente');
assert.strictEqual(abas.Pedidos.length, 1);
const p = abas.Pedidos[0];
assert.deepStrictEqual(p.slice(0, 6), [46331, '19:30', '1234', 'Maria', 'Entrega', 'Rua A, 10 (3,4 km)']); // 46331 = 05/11/2026
assert.ok(p[6].includes('2x Nº 7 (Trio) + Bacon (Molhos: Barbecue) – Obs.: sem cebola'));
assert.deepStrictEqual(p.slice(7, 13), [68, 16, 84, 'Dinheiro', '100', 'Pendente']);
assert.strictEqual(abas.Itens.length, 2);
assert.deepStrictEqual([abas.Itens[0][2], abas.Itens[0][5], abas.Itens[0].length], ['Nº 7', p[13], 6]);
// fórmula injetada vira texto; valor absurdo, pedido vazio e lixo são recusados
assert.strictEqual(enviar({ ...pedido, cliente: '=HYPERLINK("x")' }), 'ok');
assert.strictEqual(abas.Pedidos[1][3], 'HYPERLINK("x")');
assert.throws(() => enviar({ ...pedido, total: -5 }), /valor inválido/);
assert.throws(() => enviar({ ...pedido, itens: [] }), /pedido sem itens/);
assert.throws(() => enviar('lixo'), /pedido sem itens/);
enviar({ ...pedido, recebimento: 'Retirada', taxa: 0, total: 68 });
assert.deepStrictEqual([abas.Pedidos.at(-1)[4], abas.Pedidos.at(-1)[5], abas.Pedidos.at(-1)[8]], ['Retirada', '', '']);

// pedido enorme (61 itens diferentes, como o cardápio inteiro) também entra
const antes = abas.Itens.length;
assert.strictEqual(enviar({ ...pedido, itens: Array.from({ length: 61 }, (_, i) => ({ item: 'x' + i, detalhe: 'x', qtd: 1, valor: 1 })) }), 'ok');
assert.strictEqual(abas.Itens.length, antes + 61);

// Uma falha após salvar os itens pode ser repetida sem duplicar o lote.
const recuperado = { ...pedido, num: '9999' };
const salvar = planilha.getSheetByName;
planilha.getSheetByName = nome => nome === 'Pedidos'
  ? { ...salvar(nome), appendRow: () => { throw new Error('falha simulada'); } }
  : salvar(nome);
assert.throws(() => enviar(recuperado), /falha simulada/);
const itensSalvos = abas.Itens.length;
planilha.getSheetByName = salvar;
assert.strictEqual(enviar(recuperado), 'ok');
assert.strictEqual(abas.Itens.length, itensSalvos);

// relatório: toda fórmula é gravada com o idioma en_US e o idioma original volta no fim
montarRelatorio({ ...planilha, getSheetByName: () => cadeia });
assert.ok(formulas.length >= 9 && formulas.every(([idioma]) => idioma === 'en_US'));
assert.strictEqual(idiomas.at(-1), 'pt_BR');
const query = formulas.find(([, f]) => f.includes('QUERY'))[1];
assert.ok(query.includes("Col6 = 'Pago'") && !query.includes('TEXT('));
console.log('todos os testes passaram\n' + query);
