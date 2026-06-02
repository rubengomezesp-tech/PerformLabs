import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// `next lint` was removed in Next 16; we run the ESLint CLI. eslint-config-next 16
// ships a flat-config array (ESLint 9), so it's spread directly.
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "scripts/**",
      "supabase/**",
      "public/**",
      ".claude/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  {
    // eslint-config-next 16 ships newer/stricter React-Compiler rules the existing
    // code predates. The two react-hooks rules below stay warnings for now: fixing
    // them needs a careful effect refactor. The content rules (unescaped entities,
    // html-link-for-pages) have been fixed, so they're back at error.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
];

export default eslintConfig;
