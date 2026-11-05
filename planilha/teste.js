// Testa Codigo.gs com uma planilha simulada. Uso: node planilha/teste.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const abas = { Pedidos: [], Itens: [] }, formulas = [], idiomas = [];
const cadeia = new Proxy(function () {}, { get: (t, k) => k === 'setFormula' ? f => (formulas.push([idiomas.at(-1), f]), cadeia) : k === 'getMaxRows' ? () => 1000 : k === 'getMaxColumns' ? () => 26 : k === 'getBandings' ? () => [] : k === 'getFilter' ? () => null : () => cadeia, apply: () => cadeia });
const sheet = nome => (abas[nome] ? {
  appendRow: r => abas[nome].push(r), getLastRow: () => abas[nome].length + 1,
  getRange: () => ({ setValues: v => v.forEach(r => abas[nome].push(r)) }),
} : null);
const planilha = { getSheetByName: sheet, setSpreadsheetLocale: l => idiomas.push(l), getSpreadsheetLocale: () => 'pt_BR', setSpreadsheetTimeZone() {} };
global.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
global.SpreadsheetApp = { getActiveSpreadsheet: () => planilha, flush() {}, newDataValidation: () => cadeia, newConditionalFormatRule: () => cadeia, BandingTheme: {}, BorderStyle: {} };
global.Utilities = { formatDate: (d, tz, f) => f === 'HH:mm' ? '19:30' : '2026-10-29T00:00:00' };
global.ContentService = { createTextOutput: t => t };
eval(fs.readFileSync(path.join(__dirname, 'Codigo.gs'), 'utf8') + '; global.doPost = doPost; global.montarRelatorio = montarRelatorio; global.montarPedidos = montarPedidos;');

const enviar = d => doPost({ postData: { contents: typeof d === 'string' ? d : JSON.stringify(d) } });
const pedido = { num: '1234', cliente: 'Maria', pagamento: 'Dinheiro', troco: '100', recebimento: 'Entrega', endereco: 'Rua A, 10', km: 3.4, taxaCombinar: false,
  itens: [{ item: 'Nº 7', detalhe: 'Nº 7 (Trio) + Bacon', extras: 'Molhos: Barbecue', obs: 'sem cebola', qtd: 2, valor: 66 }, { item: 'Guaravita', detalhe: 'Guaravita', extras: '', obs: '', qtd: 1, valor: 2 }],
  subtotal: 68, taxa: 16, total: 84 };
assert.strictEqual(enviar(pedido), 'ok');
const p = abas.Pedidos[0];
assert.deepStrictEqual([p[1], p[2], p[3], p[4], p[5]], ['19:30', '1234', 'Maria', 'Entrega', 'Rua A, 10 (3.4 km)']);
assert.ok(p[6].includes('2x Nº 7 (Trio) + Bacon (Molhos: Barbecue) – Obs.: sem cebola'));
assert.deepStrictEqual(p.slice(7, 13), [68, 16, 84, 'Dinheiro', '100', 'Pendente']);
assert.strictEqual(abas.Itens.length, 2);
assert.deepStrictEqual([abas.Itens[0][2], abas.Itens[0][5], abas.Itens[0].length], ['Nº 7', p[13], 6]);
// fórmula injetada vira texto; valor absurdo, pedido vazio e lixo são recusados
assert.strictEqual(enviar({ ...pedido, cliente: '=HYPERLINK("x")' }), 'ok');
assert.strictEqual(abas.Pedidos[1][3], 'HYPERLINK("x")');
assert.ok(enviar({ ...pedido, total: -5 }).startsWith('erro'));
assert.ok(enviar({ ...pedido, itens: [] }).startsWith('erro'));
assert.ok(enviar('lixo').startsWith('erro'));
enviar({ ...pedido, recebimento: 'Retirada', taxa: 0, total: 68 });
assert.deepStrictEqual([abas.Pedidos.at(-1)[4], abas.Pedidos.at(-1)[5], abas.Pedidos.at(-1)[8]], ['Retirada', '', '']);

// relatório: toda fórmula é gravada com o idioma en_US e o idioma original volta no fim
montarRelatorio({ ...planilha, getSheetByName: () => cadeia });
assert.ok(formulas.length >= 9 && formulas.every(([idioma]) => idioma === 'en_US'));
assert.strictEqual(idiomas.at(-1), 'pt_BR');
const query = formulas.find(([, f]) => f.includes('QUERY'))[1];
assert.ok(query.includes("Col6 = 'Pago'") && !query.includes('TEXT('));
console.log('todos os testes passaram\n' + query);
