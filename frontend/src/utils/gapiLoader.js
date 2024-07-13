const loadGapiScript = () => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('gapi-script')) {
        resolve(window.gapi);
        return;
      }
  
      const script = document.createElement('script');
      script.id = 'gapi-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        resolve(window.gapi);
      };
      script.onerror = () => {
        reject(new Error('Failed to load the GAPI script'));
      };
  
      document.body.appendChild(script);
    });
  };
  
  const initializeGapiClient = (gapi) => {
    return new Promise((resolve, reject) => {
      gapi.load('client:auth2', {
        callback: () => {
          gapi.client.init({
            apiKey: process.env.GOOGLE_CLIENT_SECRET,
            clientId: process.env.GOOGLE_CLIENT_ID,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          }).then(() => {
            resolve(gapi);
          }).catch((error) => {
            reject(error);
          });
        },
        onerror: () => {
          reject(new Error('Failed to load the GAPI client'));
        },
      });
    });
  };
  
  export const loadGapi = () => {
    return loadGapiScript().then(initializeGapiClient);
  };
  