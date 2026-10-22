# PLANO — Color Grading

> **Regra de ouro:** a interface atual é intencional. Mudanças visuais só quando forem pedidas.
> Cada item abaixo é uma tarefa com tamanho de um PR. Ele só está concluído quando os critérios de aceite passam e `npm run lint && npm test && npm run build` fica verde.

**Legenda de tamanho:** P = até 2 h · M = meio dia · G = 1 a 2 dias.

## Ponto de partida (verificado no código em 21/10/2026)

| Já existe | Ainda não existe |
|---|---|
| 7 harmonias, 3 formatos de roda, sliders HSL | CI, deploy e arquivo `LICENSE` |
| Campos RGB/CMYK/HSL, contraste vs. branco/preto, escala tonal | Botão de travar cor (`ColorItem.locked` existe sem UI) |
| Extração de 5 cores por arrastar uma imagem na roda | Upload por botão, validação e feedback de erro |
| Simulação de 4 tipos de daltonismo (filtros SVG) | Salvar/compartilhar paletas (`SavedPalette` não é usado) |
| Exportação PNG, SVG, CSV, CSS, JSON, PDF (impressão) | Exportação Tailwind, Design Tokens, ASE e Figma |
| 6 testes de harmonia (`tests/harmonies.test.ts`) | Testes de conversões, exportação e extração de imagem |

---

## Fase 0 — Higiene do repositório (P, sem mudança visual)

- [ ] **0.1 Remover dependências não usadas.** `express`, `@types/express`, `@google/genai` e `dotenv` não são importados em `src/` nem em `vite.config.ts`. Também mover `vite`, `@vitejs/plugin-react` e `@tailwindcss/vite` para `devDependencies`.
  *Aceite:* `npm ci && npm run build` passa, e `grep -r "express\|genai\|dotenv" src vite.config.ts` não retorna nada.
- [ ] **0.2 Metadados do projeto.** Renomear `name` em `package.json` de `react-example` para `color-grading`, adicionar `"engines": { "node": ">=20" }`, remover `server.js` do script `clean` e o comentário sobre AI Studio em `vite.config.ts`, se não for mais usado.
- [ ] **0.3 Licença.** Adicionar o `LICENSE` Apache-2.0, coerente com o cabeçalho SPDX de `src/App.tsx`.
- [ ] **0.4 `.env.example`.** Remover se nenhuma variável for necessária, ou documentar cada uma.

## Fase 1 — CI e deploy (P/M)

- [ ] **1.1 Workflow `.github/workflows/ci.yml`** rodando em `pull_request` e `push` para `main`: Node 20, `npm ci`, `npm run lint`, `npm test` e `npm run build`, com cache do npm.
  *Aceite:* o PR mostra o check verde, e um erro de tipo proposital deixa o check vermelho.
- [ ] **1.2 Deploy.** Decidir o destino a partir do `base: '/webdesign/color-grading/'` (subcaminho de um site existente ou GitHub Pages, ajustando o `base`). Publicar o `dist/` automaticamente a cada merge em `main`.
  *Aceite:* a URL pública abre o app sem 404 de assets.
- [ ] **1.3 Proteção da `main`:** exigir CI verde para fazer merge.

## Fase 2 — Qualidade e testes (M)

- [ ] **2.1 Testes de `colorConversions.ts`:** ida e volta HEX→RGB→HSL/HSV/CMYK→HEX, `parseHexInput` (3 e 6 dígitos, inválido), `parseRgbInput`, `parseCmykInput` e `getContrastRatio` (preto/branco = 21:1).
- [ ] **2.2 Testes de `exportUtils.ts`:** extrair a geração de conteúdo (string CSS/CSV/JSON/SVG) para funções puras, separadas do download, e testar essas funções.
- [ ] **2.3 Bugs pequenos de exportação:**
  - `downloadSvg` divide por zero quando não há cores válidas (`downloadPng` já retorna cedo nesse caso). Aplicar a mesma guarda em todos os formatos.
  - Escapar `&`, `<` e `"` em nomes de cor dentro do SVG e do HTML do PDF, e aspas no CSV.
  - `URL.revokeObjectURL` é chamado logo após `a.click()`. Adiar com `setTimeout` para não cancelar o download em alguns navegadores.
- [ ] **2.4 Script `npm test`** passa a rodar todos os arquivos `tests/*.test.ts`.

## Fase 3 — Performance (M)

- [ ] **3.1 Medir antes de otimizar.** Rodar o Lighthouse (mobile) e o React Profiler durante um arrasto na roda. Registrar os números neste arquivo.
- [ ] **3.2 Arrasto fluido.** Garantir que o canvas da roda só redesenha o fundo quando muda o formato ou a matiz (`ColorWheel.tsx`, efeito com dependências na linha ~266). Agrupar atualizações de `pointermove` com `requestAnimationFrame`.
- [ ] **3.3 Memoizar `ColorCard`** (`React.memo` + `useCallback` em `App.tsx`) para que mexer numa cor não re-renderize todos os cartões.
  *Aceite:* o Profiler mostra no máximo 1 cartão re-renderizado por frame no modo livre, e o arrasto fica em 60 fps num notebook médio.

## Fase 4 — Recursos (G, um PR por item)

- [ ] **4.1 Travar cor.** Adicionar um botão de cadeado no `ColorCard` ligado a `ColorItem.locked`. `generateHarmonicColors` já respeita `locked`.
  *Aceite:* uma cor travada não muda ao arrastar outra cor em modo de harmonia (cobrir com teste).
- [ ] **4.2 Upload de imagem por botão**, além do drop. Hoje um arquivo que não é imagem é ignorado em silêncio. Mostrar um toast de erro, limitar o tamanho (ex.: 20 MB) e dar feedback de “processando”.
- [ ] **4.3 Salvar paletas no navegador** (`localStorage`, usando o tipo `SavedPalette`), com nome editável (hoje `paletteName` é fixo).
- [ ] **4.4 Compartilhar por link.** Serializar a paleta na URL (`?c=00E5FF-FF6B6B…&h=triangular`) e restaurá-la ao abrir.
  *Aceite:* abrir o link numa aba anônima reproduz a mesma paleta.
- [ ] **4.5 Matriz de contraste WCAG** entre todos os pares da paleta (reaproveitando `getContrastRatio`), marcando AA e AAA.
- [ ] **4.6 Novos formatos de exportação:** `tailwind.config` (`theme.extend.colors`), Design Tokens W3C (`.tokens.json`) e ASE (Adobe Swatch Exchange, binário). Figma fica para a Fase 5.

## Fase 5 — Integração com o Figma Ultra (G)

- [ ] **5.1 Extrair o núcleo** (`colorConversions` sem as partes de DOM, `harmonyGeometry` e `types`) para `packages/color-core`, sem dependência de React nem do DOM.
- [ ] **5.2** Fazer o app consumir o pacote, mantendo os testes verdes.
- [ ] **5.3** Usar o pacote no plugin de paletas do Figma Ultra (Figma-importer) e exportar a paleta como Figma Variables/Styles.

---

## Ordem sugerida

`0 → 1 → 2 → 4.1 → 4.4 → 3 → restante da 4 → 5`.

Higiene e CI vêm primeiro para que tudo depois seja verificado automaticamente. Travar cor e compartilhar por link são os recursos de maior valor com menor esforço.
