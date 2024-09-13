const path = require('path-browserify');

module.exports = {
  mode: 'development',  // Set to 'production' for production builds
  entry: './src/index.js',  // Entry point of your React app
  output: {
    filename: 'bundle.js',  // Output bundle
    path: path.resolve(__dirname, 'dist'),  // Output directory
    publicPath: '/',  // Ensure correct routing for React Router
  },
  devServer: {
    static: path.join(__dirname, 'dist'),  // Directory for static files
    port: 3001,  // You can change the port if necessary
    hot: true,  // Enable hot module replacement
    historyApiFallback: true,  // Enable client-side routing for React Router
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // Files to transpile (JavaScript and JSX)
        exclude: /node_modules/,  // Exclude node_modules
        use: {
          loader: 'babel-loader',  // Use babel-loader for transpiling
          options: {
            presets: [
              '@babel/preset-env',  // Transpile modern JavaScript (ES6+)
              '@babel/preset-react',  // Transpile JSX to JavaScript
            ],
          },
        },
      },
      {
        test: /\.css$/,  // Handle CSS files
        use: ['style-loader', 'css-loader'],  // Apply styles to the DOM
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],  // Resolve imports without file extensions
  },
  devtool: 'source-map',  // Enable source maps for easier debugging
};
