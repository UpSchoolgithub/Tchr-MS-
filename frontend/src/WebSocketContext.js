// WebSocketContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, token }) => {
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (token) {
      // Use non-secure WebSocket for testing
      const webSocket = new WebSocket('wss://www.tms.up.school/ws'); // Use 'ws://' if your backend is not using HTTPS
      setWs(webSocket);
  
      webSocket.onopen = () => {
        console.log('WebSocket connected');
        // Optionally send the token to authenticate the WebSocket connection
        webSocket.send(JSON.stringify({ type: 'AUTHENTICATE', token }));
      };
  
      webSocket.onmessage = (event) => {
        console.log('Message from server: ', event.data);
        // Handle incoming messages here
      };
  
      webSocket.onerror = (error) => {
        console.error('WebSocket error: ', error);
      };
  
      webSocket.onclose = (event) => {
        console.log('WebSocket is closed now.', event.reason);
      };
  
      // Cleanup function to close WebSocket on component unmount
      return () => {
        webSocket.close();
      };
    }
  }, [token]);
  

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
