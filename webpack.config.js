const path = require('path');

module.exports = {
  entry: {
    main: path.resolve(
      __dirname,
      './public/js/index.js',
    ),
  },
  output: {
    path: path.resolve(__dirname, './public/js'),
    filename: 'bundle.js',
  },
  mode: 'development', // Change to "production" for optimized build
  watch: true, // <--- Enable watch mode
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(
          __dirname,
          './public/js',
        ), // Only process public/js
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  devServer: {
    static: './public/js',
    hot: true,
  },
  devtool: 'source-map', // Enable source maps for debugging
};
