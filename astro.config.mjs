// @ts-check

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cascadeLayers from '@csstools/postcss-cascade-layers';

// Tailwind 4 genera CSS moderno (bloques @layer, colores oklch...).
// Los navegadores viejos (por ejemplo, el navegador de WhatsApp en un
// celular con Android sin actualizar) no entienden @layer e ignoran TODO
// el CSS: la página se ve sin estilos. Por eso, al hacer el build:
//   1) cascadeLayers quita los @layer sin cambiar cómo se ve la página.
//   2) Lightning CSS (cssMinify) convierte los colores y las medidas de
//      pantalla a CSS que entienden navegadores desde Chrome 80,
//      Safari 13 y Firefox 78 (más o menos del 2020), según cssTarget.
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    css: {
      postcss: {
        plugins: [cascadeLayers()],
      },
    },
    build: {
      cssMinify: 'lightningcss',
      cssTarget: ['chrome80', 'safari13', 'firefox78'],
    },
  },
});
