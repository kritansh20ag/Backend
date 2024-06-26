const express = require("express");
const session = require("express-session");
const { google } = require("googleapis");
const path = require("path");
const OpenAI = require("./openaiClient"); // Import  OpenAI client
const { sendReply } = require("./gmailclient"); // Import the sendReply function
const msal = require("@azure/msal-node");
const { msalConfig, authRequest, tokenRequest } = require("./outlookAuth");
const crypto = require('crypto');
const secret_key = crypto.randomBytes(64).toString('hex');
const app = express();
const PORT = 3030;

const OAuth2 = google.auth.OAuth2;

const clientID = "71273891981-nd8b6l91irbc55i35og0l5i5jrdlsike.apps.googleusercontent.com";
const clientSecret = "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";
const redirectURI = "http://localhost:3030/auth";

console.log("Initializing OAuth2Client with:", { clientID, clientSecret, redirectURI });

const oauth2Client = new OAuth2(clientID, clientSecret, redirectURI);

// Configure MSAL client
const msalClient = new msal.ConfidentialClientApplication(msalConfig);

// Use session middleware
app.use(session({
  secret: secret_key,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.get("/", function(req, res) {
  res.send("Hello Reach Inbox Team, I hope you would like my efforts and work");
});


// Route to initiate OAuth2 flow
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.modify"
    ],
  });
  res.redirect(url);
});

// Route to handle OAuth2 callback
app.get("/auth", async (req, res) => {
  const code = req.query.code;
  console.log("Received authorization code:", code);
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store the tokens in the session
    req.session.tokens = tokens;

    res.redirect("/emails");
  } catch (err) {
    console.error("Error retrieving access token", err);
    res.status(500).send("Authentication failed");
  }
});

// Route to read emails
app.get("/emails", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).send("Unauthorized");
    }

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: "is:unread", // Only fetch unread emails
    });

    const messages = response.data.messages || [];

    const emails = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });

        const headers = msg.data.payload.headers;
        const fromHeader = headers.find((header) => header.name === "From");
        const subjectHeader = headers.find((header) => header.name === "Subject");
        const from = fromHeader ? fromHeader.value : "Unknown";
        const subject = subjectHeader ? subjectHeader.value : "No Subject";
        const snippet = msg.data.snippet;

        const { state, reply } = await OpenAI.processEmail({ snippet });

        if (state === "1" && reply) {
          await sendReply(oauth2Client, message.threadId, from, `Re: ${subject}`, reply);

          // Mark the email as read
          await gmail.users.messages.modify({
            userId: "me",
            id: message.id,
            requestBody: {
              removeLabelIds: ["UNREAD"],
            },
          });
        }

        return {
          id: msg.data.id,
          snippet: snippet,
          from: from,
          label: state,
          reply: reply,
        };
      })
    );

    res.json({ emails });
  } catch (err) {
    console.error("Error reading emails", err);
    res.status(500).send("Failed to read emails");
  }
});

app.get("/auth/outlook", (req, res) => {
  const authCodeUrlParameters = {
    scopes: authRequest.scopes,
    redirectUri: authRequest.redirectUri,
  };

  msalClient.getAuthCodeUrl(authCodeUrlParameters)
    .then((response) => {
      res.redirect(response);
    })
    .catch((error) => {
      console.error("Error generating Outlook auth URL", error);
      res.status(500).send("Failed to initiate authentication");
    });
});

// Route to handle Outlook OAuth callback
app.get("/auth/outlook/callback", (req, res) => {
  const tokenRequestParams = {
    code: req.query.code,
    scopes: tokenRequest.scopes,
    redirectUri: tokenRequest.redirectUri,
  };

  msalClient.acquireTokenByCode(tokenRequestParams)
    .then((response) => {
      // Store the tokens in the session
      req.session.outlookTokens = response.accessToken;

      res.redirect("/outlook-emails");
    })
    .catch((error) => {
      console.error("Error retrieving Outlook access token", error);
      res.status(500).send("Authentication failed");
    });
});

// Route to read Outlook emails
app.get("/outlookEmails", async (req, res) => {
  const tokenResponse = req.app.locals.outlookTokens;
  const accessToken = tokenResponse.accessToken;

  const client = require("@microsoft/microsoft-graph-client").Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  try {
    const messages = await client.api("/me/mailFolders/inbox/messages").top(20).filter("isRead eq false").get();

    const emails = await Promise.all(
      messages.value.map(async (message) => {
        const from = message.from.emailAddress.address;
        const subject = message.subject;
        const snippet = message.bodyPreview;

        const { state, reply } = await OpenAI.processEmail({ snippet });

        if (state === "1" && reply) {
          await client.api(`/me/messages/${message.id}/reply`).post({
            comment: reply,
            toRecipients: [{ emailAddress: { address: from } }],
          });

          await client.api(`/me/messages/${message.id}`).update({
            isRead: true,
          });
        }

        return {
          id: message.id,
          snippet: snippet,
          from: from,
          label: state,
          reply: reply,
        };
      })
    );

    res.json({ emails });
  } catch (err) {
    console.error("Error reading Outlook emails", err);
    res.status(500).send("Failed to read emails");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



