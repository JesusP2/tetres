/** @type {import('prettier').Config} */
const config = {
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-packagejson',
    'prettier-plugin-tailwindcss', // MUST come last
  ],
  importOrder: [
    'server-only', //
    '^react-scan$',
    '^@core/(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^@server/(.*)$',
    '^@ui/(.*)$',
    '^[./]',
    '^(.*)\\.css$',
  ],
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: true,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  arrowParens: 'avoid',
};

export default config;
