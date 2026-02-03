# AtomicDocs UI – Generative API Documentation

React + Tambo-based docs UI for AtomicDocs. Developers ask in natural language (e.g. “How do I create a user?”, “Show me curl for POST /users”) and the AI renders **EndpointCard**, **CodeSnippet**, **SchemaViewer**, or **TryItPanel** as needed. Five themes (Terminal, Paper, Ocean, Sunset, Monochrome) are available via the theme selector.

## Setup

1. Copy `.env.example` to `.env` and set:
   - `VITE_TAMBO_API_KEY` – get one at [tambo.co/dashboard](https://tambo.co/dashboard)
   - `VITE_OPENAPI_URL` (optional) – defaults to `http://localhost:3000/docs/json`
2. Run your backend with AtomicDocs (e.g. Express demo) so `/docs/json` serves the OpenAPI spec.
3. `npm install` then `npm run dev`. Open the app and ask about your API.

## Themes

- **Terminal** – Dark, green accent, monospace feel  
- **Paper** – Light, minimal, reading-focused  
- **Ocean** – Blue/slate, calm and professional  
- **Sunset** – Warm, friendly, modern  
- **Monochrome** – High contrast, accessible  

Theme choice is stored in `localStorage` and applied via CSS variables.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
