// babel.config.js
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current', // Transpile for the current version of Node.js being used
        },
      },
    ],
  ],
};
