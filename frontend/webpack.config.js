module.exports = {
  resolve: {
    fallback: {
      "zlib": require.resolve("browserify-zlib"),
      "crypto": require.resolve("crypto-browserify"),
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "querystring": require.resolve("querystring-es3"),
      "fs": false // Assuming no filesystem operations are needed in the frontend.
    }
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // Add custom middleware logic here if required, or leave empty for defaults.
      console.log('Setting up middlewares');
      return middlewares;
    },
    port: 3000, // Adjust if necessary.
    historyApiFallback: true, // Enables support for single-page apps, redirects 404s to index.html
  },
};
