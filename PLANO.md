# PLANO — Color Grading

> A interface já está ótima: mudanças visuais só se forem pedidas.

## Fase 1 — CI
- [ ] GitHub Actions: `npm ci`, `npm run lint`, `npm test`, `npm run build` em todo PR.
- [ ] Deploy automático (GitHub Pages ou Vercel com preview por PR).

## Fase 2 — Performance
- [ ] Medir com Lighthouse; memoizar a roda de cores e evitar re-render a cada arrasto.
- [ ] Remover dependências não usadas (`express`, `@google/genai` se não forem necessárias no cliente).

## Fase 3 — Recursos
- [ ] Extrair paleta de uma imagem (upload com progresso/validação).
- [ ] Verificador de contraste WCAG entre pares da paleta.
- [ ] Exportar como CSS variables, Tailwind config, JSON de tokens, ASE/Adobe e Figma.
- [ ] Salvar paletas no navegador e compartilhar por link.

## Fase 4 — Integração
- [ ] Extrair o núcleo (`colorConversions`, `harmonyGeometry`) num pacote reutilizável para o plugin do Figma Ultra.
