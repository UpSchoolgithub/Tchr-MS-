const jwt = require('jsonwebtoken');

// Use the newly generated token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJ1cHNjaG8yb2xAZ21haWwuY29tIiwiaWF0IjoxNzI5NTA4Mjg1LCJleHAiOjE3MzIxMDAyODV9.JIhptGv097ZzxRfzr2kUhnCb3V9qEYtLL010Jj27Dfs';

const secret = '1ea5b2153c86ee0d25ec28bfdaf9f9f7a82509025f588911337e7f7366e863fa';  // The same secret used to generate the token

jwt.verify(token, secret, (err, decoded) => {
  if (err) {
    console.log('Token verification error:', err.message);
  } else {
    console.log('Token is valid:', decoded);
  }
});
