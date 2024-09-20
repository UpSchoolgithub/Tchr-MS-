const path = require('path');

module.exports = {
  mode: 'development',  // or 'production' for production builds
  entry: './src/index.js',  // Entry point of your React app
  output: {
    filename: 'bundle.js',  // Output bundle
    path: path.resolve(__dirname, 'dist'),  // Output directory (dist)
    publicPath: '/',  // Ensure correct routing for React Router
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // Handle JavaScript and JSX files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,  // Handle CSS files
        use: ['style-loader', 'css-loader'],  // Load and inject styles
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,  // Handle images
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]',
              outputPath: 'images',  // Output images to the "images" directory
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],  // Automatically resolve file extensions for JS/JSX
  },
  devtool: 'source-map',  // Enable source maps for easier debugging
  devServer: {
    static: path.join(__dirname, 'dist'),  // Serve from "dist" folder
    port: 3001,  // Set the development server port
    hot: true,  // Enable hot module replacement
    historyApiFallback: true,  // Support for client-side routing with React Router
  },
};
