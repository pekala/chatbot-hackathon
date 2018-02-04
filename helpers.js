const speak = require("speakeasy-nlp");
const yesNoWords = require("yes-no-words");

const isYes = update =>
  yesNoWords.yes
    .map(w => w.toLowerCase())
    .includes(update.message.text.replace(/[^a-zA-Z ]/g, "").toLowerCase());
const isNo = update =>
  yesNoWords.no
    .map(w => w.toLowerCase())
    .includes(update.message.text.replace(/[^a-zA-Z ]/g, "").toLowerCase());
const getRandom = items => items[Math.floor(Math.random() * items.length)];
const isPositive = update =>
  speak.sentiment.analyze(update.message.text).score >= 0;
const talksAbout = (update, topic) => update.message.text.includes(topic);
const isBye = (update, topic) => !!update.message.nlp.entities.bye;
const isGreeting = (update, topic) => !!update.message.nlp.entities.greetings;

module.exports = {
  isYes,
  isNo,
  getRandom,
  isPositive,
  talksAbout,
  isBye,
  isGreeting
};
