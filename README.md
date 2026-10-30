# Site W Lanches

Site de pedidos da W Lanches (Belford Roxo – RJ).

- `lanchonete/` — o site (é esta pasta que sobe no Cloudflare)
- `lanchonete/nota.html` — página de impressão da notinha (Epson TM-T20X)
- `W-Lanches-como-imprimir-a-notinha.pdf` — instruções da impressora para a loja

No ar em: https://wlanches.viniciusdev.workers.dev

## Validação automática

O workflow **Validate site** roda em pull requests, em pushes para `main` e manualmente na aba Actions.

Para executar localmente, instale Python 3.12 e Node.js 22 e rode na raiz do repositório:

```sh
python3 scripts/validate_site.py
```

A validação cobre apenas a pasta publicada `lanchonete/`:
- presença de `index.html`, doctype HTML5, idioma e título;
- IDs duplicados no HTML estático;
- sintaxe dos scripts JavaScript inline e arquivos `.js`;
- existência de arquivos locais referenciados por `src`, `href`, `poster`, CSS `url()` e caminhos literais `img/...` nos scripts inline.

Não exige pacotes adicionais. Não é um validador completo da especificação HTML,
não executa o JavaScript e não verifica URLs externas, caminhos calculados,
regras de negócio, impressão ou envio pelo WhatsApp. Esses fluxos continuam
exigindo teste no navegador. O workflow valida o código; não publica o site.
