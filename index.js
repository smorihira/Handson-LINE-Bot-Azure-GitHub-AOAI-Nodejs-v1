'use strict';

const line = require('@line/bot-sdk');
const express = require('express');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
const app = express();

// register a webhook handler with middleware
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // Define the rich message with buttons
  const richMessage = {
    type: 'template',
    altText: 'Buttons template',
    template: {
      type: 'buttons',
      text: 'Choose an option',
      actions: [
        {
          type: 'postback',
          label: '質問開始',
          data: 'action=question_start'
        },
        {
          type: 'postback',
          label: '解答完了',
          data: 'action=answer_complete'
        }
      ]
    }
  };

  // Use reply API
  return client.replyMessage(event.replyToken, richMessage);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
