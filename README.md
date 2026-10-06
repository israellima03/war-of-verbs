# War of Verbs — at the FNI

Aplicación web para aprender y practicar verbos en inglés con juegos y exámenes.

Flujo: **Aprender → Practicar → Examen → Puntuación → Ranking → Mejorar**

Hecha con Astro 7, TypeScript y Tailwind CSS 4. Sin login ni base de datos (por ahora).

## Comandos

| Comando        | Qué hace                                      |
| :------------- | :-------------------------------------------- |
| `yarn install` | Instala las dependencias                      |
| `yarn dev`     | Servidor local en `http://localhost:4321`     |
| `yarn build`   | Genera el sitio final en `./dist/`            |
| `yarn preview` | Muestra el sitio generado antes de publicarlo |

## Estructura

```
src/
├── layouts/Layout.astro        navbar, footer y <slot />
├── pages/                      cada archivo = una ruta
│   ├── index.astro             /            (incluye el formulario de sugerencias)
│   ├── aprender.astro          /aprender
│   ├── practicar.astro         /practicar   (5 juegos + pistas)
│   ├── examen.astro            /examen
│   └── ranking.astro           /ranking
├── components/                 piezas reutilizables de HTML
│   ├── VerbCard.astro
│   ├── GameCard.astro
│   ├── HintButton.astro
│   ├── ScoreCard.astro
│   └── RankingTable.astro
├── data/
│   ├── verbs.ts                lista de verbos
│   ├── questions.ts            crea preguntas y pistas
│   ├── score.ts                reglas de puntuación
│   └── ranking.ts              datos y orden del ranking
├── scripts/quiz.ts             dibuja preguntas en el navegador
├── types/verb.ts               interface Verb
└── styles/global.css           Tailwind + clases compartidas
```

Para agregar verbos, edita `src/data/verbs.ts`.
