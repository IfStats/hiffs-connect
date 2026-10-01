const apiKey = process.env.INFOBIP_API_KEY;

if (!apiKey) {
  throw new Error(
    "INFOBIP_API_KEY environment variable is required.",
  );
}

const response = await fetch(
  "https://k98qr3.api.infobip.com/sms/3/messages",
  {
    method: "POST",

    headers: {
      Authorization: `App ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify({
      messages: [
        {
          destinations: [
            {
              to: "233546471298",
            },
          ],

          sender: "ServiceSMS",

          content: {
            text: "Hiffs Connect Infobip SMS integration test.",
          },
        },
      ],
    }),
  },
);

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

if (!response.ok) {
  process.exitCode = 1;
}