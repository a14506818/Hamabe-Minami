require("dotenv").config();
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const prefix = "`";

const Discord = require("discord.js");
const client = new Discord.Client({
  partials: ["MESSAGE"],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!!!`);
});

client.on("message", (msg) => {
  if (msg.author.id === "295447759454994432") {
    msg.react("💖");
  }

  if (!msg.content.startsWith(prefix)) return;
  // reply
  if (
    /hamabe/i.test(msg.content) ||
    /minami/i.test(msg.content) ||
    /美波/i.test(msg.content)
  ) {
    msg.reply("私はここにいます");
  }
  // play music
  const cmd = msg.content.split(" ");
  console.log(cmd);
  if (
    cmd[0].toLocaleLowerCase() === prefix + "play" ||
    cmd[0].toLocaleLowerCase() === prefix + "skip"
  ) {
    play(msg, cmd);
  } else if (cmd[0].toLocaleLowerCase() === prefix + "stop") {
    stop(msg);
  } else if (cmd[0].toLocaleLowerCase() === prefix + "pl") {
    pl(msg);
  } else if (cmd[0].toLocaleLowerCase() === prefix + "help") {
    help(msg);
  } else if (
    cmd[0].toLocaleLowerCase() === prefix + "gh" ||
    cmd[0].toLocaleLowerCase() === prefix + "github" ||
    cmd[0].toLocaleLowerCase() === prefix + "git"
  ) {
    msg.reply("https://github.com/");
  }
});

client.on("messageDelete", (msg) => {
  msg.channel.send("被刪除訊息👉 " + msg.content);
});

let songList = [];

const play = async (msg, cmd) => {
  if (cmd[0].toLocaleLowerCase() === prefix + "play") {
    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) return msg.channel.send("要先進語音頻道哦🤞");
    if (cmd.length < 2) return msg.channel.send("沒有輸入音樂哦🤞");
    const connection = await voiceChannel.join();

    const videoFinder = async (query) => {
      if (isValidURL(query)) {
        const videoResult = await ytdl.getInfo(query);
        return videoResult;
      }
      const videoResult = await ytSearch(query);
      return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
    };
    const video = await videoFinder(cmd[1]);
    let song = {};
    if (video && isValidURL(cmd[1])) {
      song = {
        title: video.videoDetails.title,
        url: video.videoDetails.video_url,
      };
      console.log(song);
      songList = [...songList, song];
      if (songList.length > 1) msg.channel.send(`新增歌曲👉${song.title}`);
      if (songList.length === 1) playList(msg, connection);
    } else if (video && !isValidURL(cmd[1])) {
      song = { title: video.title, url: video.url };
      console.log(song);
      songList = [...songList, song];
      if (songList.length > 1) msg.channel.send(`新增歌曲👉${song.title}`);
      if (songList.length === 1) playList(msg, connection);
    } else {
      msg.reply("找不到音樂😢");
    }
  }
  if (cmd[0].toLocaleLowerCase() === prefix + "skip") {
    if (songList.length === 1) return stop(msg);
    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) return msg.channel.send("要先進語音頻道哦🤞");
    const connection = await voiceChannel.join();
    songList.shift();
    playList(msg, connection);
  }
};
const playList = async (msg, connection) => {
  if (songList) {
    const stream = ytdl(songList[0].url, { filter: "audioonly" });
    connection.play(stream, { seek: 0, volume: 1 }).on("finish", () => {
      songList.shift();
      if (songList.length === 0) return msg.channel.send("沒有歌了😢");
      playList(msg, connection);
    });
    await msg.channel.send(`正在播放: ***${songList[0].title}***💖`);
    // await msg.channel.send(songList[0].image);
  }
};

const stop = async (msg) => {
  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannel) return msg.channel.send("要先進語音頻道哦🤞");
  songList = [];
  await voiceChannel.leave();
  await msg.channel.send("那我要去睡啦💤💤💤");
};

const pl = async (msg) => {
  if (songList) {
    msg.channel.send("👇***目前歌單***👇");
    songList.forEach((song) => {
      msg.channel.send(`${song.title}`);
    });
    msg.channel.send("👆***目前歌單***👆");
  }
};

const help = async (msg) => {
  msg.channel.send(
    "👇***點歌指令***👇\n***點歌: `play 'musicName or musicURL(限YT)'***\n***跳過: `skip***\n***關閉: `stop***\n***歌單: `pl***\n👆***點歌指令***👆"
  );
};

const isValidURL = (str) => {
  var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if (!regex.test(str)) {
    return false;
  } else {
    return true;
  }
};

client.login(process.env.BOT_TOKEN);
