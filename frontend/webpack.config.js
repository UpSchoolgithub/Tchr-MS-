module.exports = {
  // Other configurations...
  resolve: {
    fallback: {
      "zlib": require.resolve("browserify-zlib"),
      "crypto": require.resolve("crypto-browserify"),
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "querystring": require.resolve("querystring-es3"),
      "fs": false  // Use false if you don't require filesystem operations in the frontend.
    }
  },
  devServer: {
    // Replace deprecated middleware setup with setupMiddlewares
    setupMiddlewares: (middlewares, devServer) => {
      // Add any custom middleware logic if needed, otherwise leave as is
      console.log('Setting up middlewares');
      return middlewares;
    },
    // Additional devServer options (optional)
    port: 3000, // Adjust the port as needed
  }
};
