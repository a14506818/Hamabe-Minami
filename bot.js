require("dotenv").config();
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const prefix = "`";

const Discord = require("discord.js");
const client = new Discord.Client({
  partials: ["MESSAGE"],
});
client.login(process.env.BOT_TOKEN);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!!!`);
});

client.on("messageDelete", (msg) => {
  msg.channel.send("***被刪除訊息👉 ***" + msg.content);
});

client.on("message", (msg) => {
  if (msg.author.id === "295447759454994432") {
    msg.react("💖");
  }

  // reply
  if (
    /hamabe/i.test(msg.content) ||
    /minami/i.test(msg.content) ||
    /美波/i.test(msg.content)
  ) {
    msg.reply("***私はここにいます***");
  }

  if (!msg.content.startsWith(prefix)) return;
  // play music
  let cmd = msg.content.split(" ");
  if (cmd.length > 1) {
    cmd = [
      msg.content.substr(0, msg.content.indexOf(" ")),
      msg.content.substr(msg.content.indexOf(" ") + 1),
    ];
  }
  cmd[0] = cmd[0].toLocaleLowerCase().substr(1);
  console.log(cmd);
  if (cmd[0] === "play" || cmd[0] === "skip") {
    play(msg, cmd);
  } else if (cmd[0] === "stop") {
    stop(msg);
  } else if (cmd[0] === "pl") {
    pl(msg);
  } else if (cmd[0] === "np") {
    np(msg);
  } else if (cmd[0] === "seek") {
    seek(msg, cmd);
  } else if (cmd[0] === "replay") {
    replay(msg);
  } else if (cmd[0] === "help") {
    help(msg);
  } else if (cmd[0] === "gh" || cmd[0] === "github" || cmd[0] === "git") {
    msg.reply("https://github.com/");
  }
});

let songList = [];

const play = async (msg, cmd) => {
  if (cmd[0] === "play") {
    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) return msg.channel.send("***要先進語音頻道哦🤞***");
    if (cmd.length < 2) return msg.channel.send("***沒有輸入音樂哦🤞***");
    // const connection = await voiceChannel.join();

    const videoFinder = async (query) => {
      if (isValidURL(query)) {
        const videoResult = await ytdl.getInfo(query);
        return videoResult;
      }
      const videoResult = await ytSearch(query);
      return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
    };
    const video = await videoFinder(cmd[1]).catch((response) => {
      return msg.channel.send("***影片截取錯誤***🤞");
    });
    let song = {};
    if (video && isValidURL(cmd[1])) {
      song = {
        title: video.videoDetails.title,
        url: video.videoDetails.video_url,
        time: 0,
        maxSec: parseInt(video.videoDetails.lengthSeconds),
      };
      console.log(song);
      songList = [...songList, song];
      if (songList.length > 1)
        msg.channel.send(`***新增歌曲👉${song.title}***`);
      if (songList.length === 1) playList(msg);
    } else if (video && !isValidURL(cmd[1])) {
      song = {
        title: video.title,
        url: video.url,
        time: 0,
        maxSec: video.seconds,
      };
      console.log(song);
      songList = [...songList, song];
      if (songList.length > 1)
        msg.channel.send(`***新增歌曲👉${song.title}***`);
      if (songList.length === 1) playList(msg);
    } else {
      msg.reply("***找不到音樂😢***");
    }
  }
  if (cmd[0] === "skip") {
    if (songList.length === 1) return stop(msg);
    songList.shift();
    playList(msg);
  }
};
const playList = async (msg) => {
  if (songList) {
    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) return msg.channel.send("***要先進語音頻道哦🤞***");
    const connection = await voiceChannel.join();

    const stream = ytdl(songList[0].url, { filter: "audioonly" });
    connection
      .play(stream, { seek: songList[0].time, volume: 1 })
      .on("finish", () => {
        songList.shift();
        if (songList.length === 0) return msg.channel.send("***沒有歌了😢***");
        playList(msg, connection);
      });
    await msg.channel.send(`***正在播放: ${songList[0].title}***💖`);
    // await msg.channel.send(songList[0].image);
  }
};

const stop = async (msg) => {
  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannel) return msg.channel.send("***要先進語音頻道哦🤞***");
  songList = [];
  await voiceChannel.leave();
  await msg.channel.send("***那我要去睡啦💤💤💤***");
};

const pl = async (msg) => {
  if (songList.length !== 0) {
    msg.channel.send("👇***目前歌單***👇");
    songList.forEach((song) => {
      msg.channel.send(`${song.title}`);
    });
    msg.channel.send("👆***目前歌單***👆");
  } else {
    msg.channel.send("***目前歌單是空的***🤞");
  }
};

const np = async (msg) => {
  if (songList.length !== 0) {
    msg.channel.send(
      `***目前歌曲👉${songList[0].title}\nURL👉${songList[0].url}\n歌曲長度👉${songList[0].maxSec}sec***`
    );
  } else {
    msg.channel.send("***目前歌單是空的***🤞");
  }
};

const seek = async (msg, cmd) => {
  if (songList.length === 0) {
    return msg.channel.send("***目前歌單是空的***🤞");
  }
  if (cmd.length !== 2) {
    return msg.channel.send("***輸入格式不對哦***🤞\n👉'`seek second'");
  }
  if (/\D/.test(cmd[1])) {
    return msg.channel.send("***請輸入正確秒數***🤞");
  }
  cmd[1] = parseInt(cmd[1]);
  if (songList[0].maxSec < cmd[1]) {
    return msg.channel.send("***輸入秒數超過歌曲長度***🤞");
  }

  songList[0].time = cmd[1];
  playList(msg);
};

const replay = async (msg) => {
  if (songList.length === 0) {
    return msg.channel.send("***目前歌單是空的***🤞");
  }
  songList[0].time = 0;
  playList(msg);
};

const help = async (msg) => {
  msg.channel.send(
    "👇***點歌指令***👇\n***點歌: `play 'musicName or musicURL(限YT)'***\n***跳過: `skip***\n***關閉: `stop***\n***歌單: `pl***\n***目前歌曲: `np***\n***跳到指定秒數: `seek 'second'***\n***重播: `replay***\n👆***點歌指令***👆"
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
