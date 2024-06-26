const msalConfig = {
    auth: {
      clientId: "16c865a6-7dd2-49eb-af9b-627be998e364",
      authority: "https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a",
      clientSecret: "6a22ed06-e392-44c1-86aa-523b349ee487",
    },
  };
  
  const authRequest = {
    scopes: ["Mail.Read", "Mail.Send", "Mail.ReadWrite"],
    redirectUri: "http://localhost:3030/auth/outlook/callback",
  };
  
  const tokenRequest = {
    scopes: ["Mail.Read", "Mail.Send", "Mail.ReadWrite"],
    redirectUri: "http://localhost:3030/auth/outlook/callback",
  };
  
  module.exports = { msalConfig, authRequest, tokenRequest };
  