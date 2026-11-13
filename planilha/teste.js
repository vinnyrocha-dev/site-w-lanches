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
eval(fs.readFileSync(path.join(__dirname, 'Codigo.gs'), 'utf8') + '; global.registrarPedido = registrarPedido; global.ativarBackup = ativarBackup; global.fazerBackup = fazerBackup; global.limparDadosAntigos = limparDadosAntigos; global.montarRelatorio = montarRelatorio; global.montarPedidos = montarPedidos;');

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
// backup: cria a pasta, copia a planilha, mantém só as 12 mais novas e agenda um gatilho semanal único
{
  const lixo = [], copias = [], gatilhos = [{ getHandlerFunction: () => 'fazerBackup' }];
  let criadaEm = 0, pastaCriada = 0;
  const pasta = { getFiles: () => { let i = 0; return { hasNext: () => i < copias.length, next: () => copias[i++] }; } };
  global.DriveApp = {
    getFoldersByName: () => ({ hasNext: () => pastaCriada > 0, next: () => pasta }),
    createFolder: () => (pastaCriada++, pasta),
    getFileById: () => ({ makeCopy: () => { const n = ++criadaEm; let lixeira = false; copias.push({ getDateCreated: () => n, isTrashed: () => lixeira, setTrashed: v => { lixeira = v; lixo.push(n); } }); } }),
  };
  let funcaoG; const cadeiaG = { timeBased: () => cadeiaG, onWeekDay: () => cadeiaG, everyDays: () => cadeiaG, atHour: () => cadeiaG, create: () => { const f = funcaoG; gatilhos.push({ getHandlerFunction: () => f }); } };
  global.ScriptApp = { getProjectTriggers: () => gatilhos.slice(), deleteTrigger: t => gatilhos.splice(gatilhos.indexOf(t), 1), newTrigger: f => (funcaoG = f, cadeiaG), WeekDay: { MONDAY: 'MONDAY' } };
  global.Utilities.formatDate = () => '2026-11-13';
  const openByIdOriginal = global.SpreadsheetApp.openById;
  global.SpreadsheetApp.openById = () => ({ getSheetByName: () => ({ getLastRow: () => 1 }) }); // planilha vazia
  ativarBackup();
  assert.deepStrictEqual(gatilhos.map(g => g.getHandlerFunction()).sort(), ['fazerBackup', 'limparDadosAntigos']);
  assert.deepStrictEqual([pastaCriada, copias.length], [1, 1]);
  for (let i = 0; i < 14; i++) fazerBackup();
  assert.strictEqual(pastaCriada, 1);
  assert.strictEqual(copias.filter(c => !c.isTrashed()).length, 4);
  assert.ok(copias.filter(c => !c.isTrashed()).every(c => c.getDateCreated() > 11)); // ficaram as mais novas
}

// guarda de 90 dias: só pedidos com mais de 90 dias perdem nome, endereço, observações e troco
{
  const hoje = 46339; // 13/11/2026
  const linhas = [
    [hoje - 91, '10:00', '1', 'Velha', 'Entrega', 'Rua X, 1 (2 km)', '1x Nº 1 – Obs.: sem cebola\n1x Guaravita', 8, 4, 12, 'Dinheiro', '50'],
    [hoje - 90, '10:00', '2', 'Limite', 'Retirada', '', '1x Nº 2', 9, '', 9, 'Pix', ''],
    [hoje - 5, '10:00', '3', 'Nova', 'Entrega', 'Rua Y, 2', '1x Nº 3 – Obs.: bem passado', 11, 4, 15, 'Dinheiro', '20'],
  ];
  let gravado = null;
  global.Utilities.formatDate = () => '2026-11-13';
  global.SpreadsheetApp.openById = () => ({ getSheetByName: () => ({ getLastRow: () => linhas.length + 1, getRange: () => ({ getValues: () => linhas.map(r => r.slice()), setValues: v => (gravado = v) }) }) });
  assert.strictEqual(limparDadosAntigos(), 1);
  assert.deepStrictEqual([gravado[0][3], gravado[0][5], gravado[0][6], gravado[0][11], gravado[0][9]], ['Anonimizado', 'Anonimizado', '1x Nº 1\n1x Guaravita', '', 12]);
  assert.deepStrictEqual(gravado[1], linhas[1]);
  assert.deepStrictEqual(gravado[2], linhas[2]);
}

console.log('todos os testes passaram\n' + query);
