const path = require('path');

module.exports = {
  mode: 'development',  // Set to 'production' for production builds
  entry: './src/index.js',  // Entry point of your React app
  output: {
    filename: 'bundle.js',  // Output bundle
    path: path.resolve(__dirname, 'dist'),  // Output directory (should create 'dist' folder)
    publicPath: '/',  // Ensure correct routing for React Router
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
