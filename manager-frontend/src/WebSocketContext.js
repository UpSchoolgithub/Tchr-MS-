const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',  // Adjust the entry point to your actual main file
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 3001,  // Adjust the port if necessary
    hot: true,   // Enable hot module replacement
    historyApiFallback: true, // For React Router
    setupMiddlewares: (middlewares, devServer) => {
      // Use setupMiddlewares to replace the deprecated options
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      return middlewares;
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Ensure Babel is installed for transpiling JS
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // For handling CSS files
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
