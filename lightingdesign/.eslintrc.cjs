module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['react-hooks', 'import'],
  rules: {
    'no-unused-vars': ['warn', {
      'varsIgnorePattern': '^_',
      'argsIgnorePattern': '^_'
    }],
    'react/prop-types': 'off',
    'prettier/prettier': 'off',
    'react/display-name': 'off',
    'import/no-unresolved': 'off',
    'no-empty': 'off',
    'no-useless-escape': 'off',
    'react-hooks/exhaustive-deps': 'off',
    // this rule is annoying on strings with quotes in them
    'react/no-unescaped-entities': 'off',
  },
}
