'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

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
  if (event.type === 'message' && event.message.type === 'text') {
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
            label: '質問完了',
            data: 'action=question_complete'
          },
          {
            type: 'postback',
            label: '解答開始',
            data: 'action=answer_start'
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
    try {
      await client.replyMessage(event.replyToken, richMessage);
    } catch (error) {
      console.error('Error sending reply message:', error);
    }
  } else if (event.type === 'postback') {
    // Handle postback events
    const userId = event.source.userId;
    const postbackData = event.postback.data;
    let status, message;

    if (postbackData === 'action=question_start') {
      status = 1;
      message = '質問を開始します！';
    } else if (postbackData === 'action=question_complete') {
      status = 0;
      message = '質問を終了します！';
    } else if (postbackData === 'action=answer_start') {
      status = 1;
      message = '解答を開始します！';
    } else if (postbackData === 'action=answer_complete') {
      status = 0;
      message = '解答を終了します！';
    } else {
      return Promise.resolve(null);
    }

    try {
      await axios.put('http://localhost:5000/question', {
        user_id: userId,
        status: status
      });

      // メッセージをユーザーに送信
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: message
      });
    } catch (error) {
      console.error('Error making PUT request:', error);
    }
  }

  return Promise.resolve(null);
}

// listen on port
const port = process.env.PORT || 7071;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
