// webpack.config.js
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
  }
};
