const StateMachine = require("javascript-state-machine");
const botSetup = require("./bot-setup");
const {
  isYes,
  isNo,
  getRandom,
  isPositive,
  talksAbout,
  isBye,
  isGreeting
} = require("./helpers");
const botmaster = botSetup();

const GameState = StateMachine.factory({
  init: "chat_initiated",
  transitions: [
    { name: "reject", from: "chat_initiated", to: "chat_initiated" },
    { name: "greet", from: "chat_initiated", to: "greeted" },
    { name: "quit", from: "greeted", to: "chat_initiated" },
    { name: "farewell", from: "*", to: "chat_initiated" },
    { name: "startGame", from: "greeted", to: "game_started" },
    { name: "rejectAnswer", from: "game_started", to: "game_started" },
    { name: "succeed", from: "game_started", to: "succeeded" },
    { name: "finish", from: "succeeded", to: "chat_initiated" },
    {
      name: "beConfused",
      from: "*",
      to: function() {
        return this.state;
      }
    }
  ],
  methods: {
    onReject: function(lifecycle, bot, update, next) {
      const answers = [
        `It's not nice to start a chat without a greeting...`,
        `Let's start over. What do you say when you bother someone on a chat?`,
        `I'm just a bot, but you should still be nice.`
      ];
      bot.reply(update, getRandom(answers)).then(() => next());
    },
    onGreet: function(lifecycle, bot, update, next) {
      const answers = [
        `Hello ${
          update.userInfo.first_name
        }, I can see you want to play a game. Are you ready?`,
        `Sup ${
          update.userInfo.first_name
        }, good to see you here. I have a game we can play here. Ready?`
      ];
      bot.reply(update, getRandom(answers)).then(() => next());
    },
    onQuit: function(lifecycle, bot, update, next) {
      const answers = [
        `Sure... See you next time.`,
        `Aight, I will just pretent we never spoke`,
        `Ok... why did you even... Whatever.`,
        `Sure, fine. Be that way. So long.`
      ];
      bot.reply(update, getRandom(answers)).then(() => next());
    },
    onFarewell: function(lifecycle, bot, update, next) {
      const answers = [
        `It was nice talking to you!`,
        `See you soon!`,
        `So long, human.`,
        `It was enchanting to meet you.`
      ];
      bot.reply(update, getRandom(answers)).then(() => next());
    },
    onStartGame: function(lifecycle, bot, update, next) {
      const answers = [`Cool!`, `Nice!`, `Aye aye!`, `Let's do this!`];
      bot
        .sendTextCascadeTo(
          [getRandom(answers), "What is the meaning of life?"],
          update.sender.id
        )
        .then(() => next());
    },
    onSucceed: function(lifecycle, bot, update, next) {
      const answers = [
        "Wow, right on!",
        "Yup, you got it. Pretty impressive.",
        "Yes, yes, yes! They are pretty cool, right?"
      ];
      bot.reply(update, getRandom(answers)).then(() => next());
    },
    onBeConfused: function(lifecycle, bot, update, next) {
      const answers = [
        `Not sure what you mean dawg.`,
        `This doesn't make sense`,
        `Wait... what?`,
        `Can you be more clear?`,
        `I'm just a stupid bot, can you be more precise?`,
        `Does not compute!`
      ];

      let followUp;
      if (this.state === "greeted") {
        followUp = "Do you want to play?";
      } else {
        followUp = "Come again?";
      }

      return bot
        .sendTextCascadeTo([getRandom(answers), followUp], update.sender.id)
        .then(() => next());
    },
    onRejectAnswer: function(lifecycle, bot, update, next) {
      let answers;
      if (update.message.text === "42") {
        answers = [
          "Really, 42? Like the number 42? Are you drunk?",
          "Funny, but not true?"
        ];
      } else {
        answers = ["Try again, it's not that difficult"];
      }
      bot.reply(update, getRandom(answers)).then(() => next());
    },
    onFinish: function(lifecycle, bot, update, next) {
      return bot
        .sendTextCascadeTo(
          [
            "Initializing memory wiping sequence",
            "Three",
            "Two",
            "One",
            "<Memory wiped>"
          ],
          update.sender.id
        )
        .then(() => next());
    },
    onTransition: function({ from, to, transition }) {
      console.log({ from, to, transition });
    }
  }
});

const handleReply = (bot, update, next) => {
  const fsm = update.userState;

  if (isBye(update)) {
    fsm.farewell(bot, update, next);
    return;
  }

  switch (fsm.state) {
    case "chat_initiated":
      if (isGreeting(update)) {
        fsm.greet(bot, update, next);
      } else {
        fsm.reject(bot, update, next);
      }
      break;
    case "greeted":
      if (isYes(update)) {
        fsm.startGame(bot, update, next);
      } else if (isNo(update)) {
        fsm.quit(bot, update, next);
      } else {
        fsm.beConfused(bot, update, next);
      }
      break;
    case "game_started":
      if (talksAbout(update, "finite state machine") && isPositive(update)) {
        fsm.succeed(bot, update, next);
      } else {
        fsm.rejectAnswer(bot, update, next);
      }
      break;
    case "succeeded":
      fsm.finish(bot, update, next);
      break;
    default:
      break;
  }
};

const addUserInfo = (bot, update, next) => {
  if (bot.retrievesUserInfo) {
    return bot.getUserInfo(update.sender.id).then(userInfo => {
      update.userInfo = userInfo;
      next();
    });
  }
  return Promise.resolve();
};

const users = {};
const addUserState = (bot, update, next) => {
  users[update.sender.id] = users[update.sender.id] || new GameState();
  update.userState = users[update.sender.id];
  next();
};

botmaster.use({
  type: "incoming",
  name: "add-user-info",
  controller: addUserInfo
});

botmaster.use({
  type: "incoming",
  name: "add-user-state",
  controller: addUserState
});

botmaster.use({
  type: "incoming",
  name: "handle-reply",
  controller: handleReply
});

botmaster.on("error", (bot, err) => {
  console.error(err.message);
});
