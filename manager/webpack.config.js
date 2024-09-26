const path = require('path');

module.exports = {
  // Entry point: The main file of your application
  entry: './src/index.js',

  // Output: Where Webpack will bundle your files
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },

  // Loaders: Define how different file types are handled
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // Files ending in .js or .jsx
        exclude: /node_modules/,  // Don't transpile node_modules
        use: {
          loader: 'babel-loader',  // Use Babel to transpile these files
        },
      },
      {
        test: /\.css$/,  // CSS files
        use: ['style-loader', 'css-loader'],  // Process CSS files and inject them into the DOM
      },
      {
        test: /\.(png|jpg|gif|svg)$/,  // Image files
        use: {
          loader: 'file-loader',  // Handle image assets
          options: {
            name: '[name].[ext]',
            outputPath: 'images/',  // Put images in the 'images/' folder
          },
        },
      },
    ],
  },

  // Resolve: Automatically resolve certain file extensions
  resolve: {
    extensions: ['.js', '.jsx'],  // Automatically resolve .js and .jsx files
  },

  // DevServer: Configure Webpack Dev Server for local development
  devServer: {
    historyApiFallback: true,  // Serve index.html for all routes
    contentBase: './',  // Serve static files from the root directory
    hot: true,  // Enable Hot Module Replacement (HMR)
    port: 3004,  // Specify the port here
  },
};
