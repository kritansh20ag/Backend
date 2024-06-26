const { google } = require("googleapis");

async function sendReply(auth, threadId, to, subject, body) {
  const gmail = google.gmail({ version: "v1", auth });

  const raw = makeBody(to, subject, body);
  
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: raw,
      threadId: threadId,
    },
  });
}

function makeBody(to, subject, body) {
  const str = [
    "Content-Type: text/plain; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ", to, "\n",
    "subject: ", subject, "\n\n",
    body,
  ].join('');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

module.exports = { sendReply };
