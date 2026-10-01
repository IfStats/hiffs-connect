const apiKey = process.env.INFOBIP_API_KEY;
const messageId = process.env.INFOBIP_MESSAGE_ID;

if (!apiKey) {
  throw new Error(
    "INFOBIP_API_KEY environment variable is required.",
  );
}

if (!messageId) {
  throw new Error(
    "INFOBIP_MESSAGE_ID environment variable is required.",
  );
}

const url =
  `https://k98qr3.api.infobip.com/sms/3/reports?messageId=${encodeURIComponent(messageId)}`;

const response = await fetch(url, {
  headers: {
    Authorization: `App ${apiKey}`,
    Accept: "application/json",
  },
});

const body = await response
  .json()
  .catch(async () => ({
    raw: await response.text(),
  }));

console.log(
  JSON.stringify(
    {
      status: response.status,
      ok: response.ok,
      body,
    },
    null,
    2,
  ),
);