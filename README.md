# Color Grading 🎨

**Seletor de cores e criador de paletas open source, online e gratuito.**

Escolha cores numa roda cromática, gere harmonias, simule visão de daltonismo e exporte a paleta — com uma interface limpa que já está do jeito que deveria ser.

## Recursos (existentes)
- Roda de cores com formatos diferentes e harmonias (análogas, complementares, triádicas…).
- Cartões de cor editáveis e pré-visualização da paleta em faixa.
- Simulação de visão (filtros SVG para daltonismo).
- Conversões de cor e exportação (`src/utils/exportUtils.ts`).
- Testes de harmonias (`npm test`).

## Rodar localmente
```bash
npm install
npm run dev     # http://localhost:3000
npm run lint    # checagem de tipos
npm test
npm run build
```

## Roadmap
Performance, novos recursos (extrair paleta de imagem, contraste WCAG, exportar para Figma/Tailwind/CSS) e CI. Ver **[PLANO.md](PLANO.md)**. Este repositório também será a base do plugin de paletas do **Figma Ultra** (Figma-importer).


> Este README e o PLANO.md foram reorganizados em 21/10/2026 a partir da visão do André. Itens marcados como **planejado** ainda não existem no código.
