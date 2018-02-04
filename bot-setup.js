const Botmaster = require("botmaster");
const MessengerBot = require("botmaster-messenger");
const botmaster = new Botmaster();

const messengerSettings = {
  credentials: {
    verifyToken: process.env.VERIFY_TOKEN,
    pageToken: process.env.PAGE_TOKEN,
    fbAppSecret: process.env.FB_APP_SECRET
  },
  webhookEndpoint: "webhook" // botmaster will mount this webhook on /messenger/webhook
};

module.exports = function botSetup() {
  const messengerBot = new MessengerBot(messengerSettings);
  botmaster.addBot(messengerBot);
  return botmaster;
};
