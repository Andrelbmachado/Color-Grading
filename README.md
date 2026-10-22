# Color Grading 🎨

**Seletor de cores e criador de paletas open source, online e gratuito.**

Escolha uma cor na roda cromática, deixe a harmonia gerar o resto da paleta, confira como ela aparece para pessoas com daltonismo e exporte em seis formatos. Tudo roda no navegador: sem conta, sem servidor, sem coleta de dados.

---

## ✨ O que já funciona

### Roda cromática e harmonias
- **3 formatos de seletor:** anel com círculo, triângulo ou quadrado de saturação/brilho no centro.
- **7 modos de harmonia:** livre, monocromática, análoga, complementar, complementar dividida, triádica e quadrada. Arraste qualquer marcador e as outras cores acompanham, mantendo os ângulos.
- **Sliders de Matiz, Saturação e Luminosidade (HSL)** sob a roda, com ajuste por teclado.

### Cartões de cor
- Campos numéricos em **RGB, CMYK e HSL**: arraste para ajustar, ou dê dois cliques / Enter para digitar.
- **Contraste WCAG** de cada cor com branco e com preto, com selos AA (≥ 4,5:1) e AAA (≥ 7:1).
- **Escala tonal** de 10% a 90% de luminosidade: clique em um tom para aplicá-lo.
- Quantas cores você quiser, com o botão **“Adicionar Mais Uma Cor”**.

### Paleta a partir de imagem
- **Arraste uma imagem para cima da roda** e o app extrai as 5 cores dominantes (modo harmonia passa para “livre”).

### Simulador de visão
- **Deuteranopia, protanopia, tritanopia e acromatopsia**, via filtros SVG aplicados à roda, aos cartões e à barra de paleta.

### Visualização e exportação
- Barra de paleta com **copiar todos os HEX** e **pré-visualização em tela cheia** (clique numa coluna para copiar o HEX dela).
- Exportação em **PNG, SVG, CSV, CSS (custom properties `--color-N`), JSON e PDF** (o PDF abre a janela de impressão do navegador).
- **Tema claro/escuro** (abre no escuro).

---

## 🚀 Rodar localmente

Requisitos: **Node.js 20+** e npm.

```bash
npm install
npm run dev       # http://localhost:3000/webdesign/color-grading/
```

> O `vite.config.ts` define `base: '/webdesign/color-grading/'`. Por isso o app fica nesse caminho, e não na raiz `/`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3000 |
| `npm run lint` | Checagem de tipos (`tsc --noEmit`) |
| `npm test` | Testes das harmonias (`tests/harmonies.test.ts`, `node:test` + `tsx`) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |

Não há variáveis de ambiente obrigatórias para rodar o app.

---

## 🗂️ Estrutura

```
src/
├── App.tsx                      # estado da paleta, harmonia, visão e tema
├── types.ts                     # HarmonyType, WheelShape, VisionMode, ColorItem…
├── components/
│   ├── ColorWheel.tsx           # roda (canvas), marcadores, sliders HSL, drop de imagem
│   ├── ColorCard.tsx            # campos RGB/CMYK/HSL, contraste WCAG, escala tonal
│   ├── PalettePreview.tsx       # barra inferior da paleta
│   ├── FullStripPreviewModal.tsx
│   ├── Header.tsx               # marca, menu de exportação, tema
│   └── VisionFilterSvg.tsx      # matrizes SVG do simulador de daltonismo
└── utils/
    ├── colorConversions.ts      # conversões HEX/RGB/HSL/HSV/CMYK, harmonias, extração de imagem
    ├── harmonyGeometry.ts       # geometria das linhas de harmonia na roda
    └── exportUtils.ts           # PNG, SVG, CSV, CSS, JSON, PDF
tests/harmonies.test.ts
```

Stack: React 19 · TypeScript · Vite · Tailwind CSS 4 · lucide-react.

---

## 🧭 Roadmap

Os itens abaixo são **planejados** e **ainda não existem** no código. Detalhes, critérios de aceite e ordem estão no **[PLANO.md](PLANO.md)**.

- **Planejado:** CI no GitHub Actions e deploy automático.
- **Planejado:** travar cores (o campo `locked` já existe no modelo, mas não há botão na interface).
- **Planejado:** salvar paletas no navegador e compartilhar por link (o tipo `SavedPalette` existe, mas não é usado).
- **Planejado:** nome de paleta editável (hoje é fixo em “Color Grading”).
- **Planejado:** upload de imagem por botão, além do arrastar e soltar.
- **Planejado:** matriz de contraste WCAG entre pares de cores da paleta.
- **Planejado:** exportar para Tailwind, Design Tokens (W3C), ASE (Adobe) e Figma.
- **Planejado:** núcleo de cor como pacote reutilizável, base do plugin de paletas do **Figma Ultra** (Figma-importer).

---

## 🤝 Contribuindo

1. Crie uma branch a partir de `main`.
2. Rode `npm run lint && npm test && npm run build` antes de abrir o PR.
3. A interface atual é intencional: mudanças visuais só quando forem pedidas.

O cabeçalho de `src/App.tsx` declara **Apache-2.0**. O arquivo `LICENSE` ainda não está no repositório (ver PLANO.md, Fase 0).
