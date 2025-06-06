module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true, // Added node for build scripts, etc.
    "jest": true // Added jest for test files
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "rules": {
    // Add any specific rules or overrides here
    "no-unused-vars": ["warn"], // Example: warn about unused variables
    "no-console": ["off"], // Example: allow console.log
    // "indent": ["error", 2], // Example: enforce 2-space indentation
    // "linebreak-style": ["error", "unix"], // Example: enforce Unix linebreaks
    // "quotes": ["error", "single"], // Example: enforce single quotes
    // "semi": ["error", "always"] // Example: require semicolons
  },
  "globals": {
    "Vue": "readonly", // To prevent 'Vue is not defined' errors
    "window": "readonly",
    "document": "readonly",
    "navigator": "readonly",
    "deepClone": "readonly", // If deepClone is a global utility
    "createWeaknessArray": "readonly" // If this is a global utility
    // Add other global variables your project uses
  }
};
