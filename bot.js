/*
/*************************
* Kalo mau pake tinggal pake aja 
* jangan hapus sumber nya
* Github : BOTCAHX 
* Source Code : https://github.com/BOTCAHX/whatsapp-gpt
**************************
*/
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { platform } = require('node:os');
const uploader = require('./lib/upload_file');
const { askGPT, GptGo } = require('./lib/gpt_bot');
const chalk = require('chalk');
const { puppeteer } = require('puppeteer');
const { fromBuffer } = require('file-type');
const fetch = require('node-fetch');

const BASE_URL = 'https://aemt.me'

const emoji_loading = [
  '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛',
  '🕜', '🕤', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'
];
const react_loading = emoji_loading[Math.floor(Math.random() * emoji_loading.length)];
const react_done = '✔️'

const client = new Client({
        authStrategy: new LocalAuth({
        // proxyAuthentication: { username: 'username', password: 'password' },
        clientId: 'whatsapp-web',
        dataPath: './sessions'
    }),
    puppeteer: {
        headless: true,
        // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", 
      "--disable-gpu",
    ],
        authStrategy: new LocalAuth(),
        executablePath: platform() === 'win32' ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome-stable'
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

console.log(client)

client.on("qr", (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', message => {
// jika pemulihan sesi tidak berhasil
    console.error('AUTHENTICATION FAILURE', message);
});

// auto reject jika telpon masuk
client.on("call", async call => {
  await call.reject();
  await client.sendMessage(call.from, `\`\`\`This number can only receive text messages!\`\`\``)
});

client.on('ready', async () => {
    console.log(`${JSON.stringify(client.info)}`)
});

client.initialize();

// message responses
client.on("message", async (message) => {
  console.log(chalk.bgYellow.black(`${message.fromMe ? 'Me' : message.from}`));
  console.log(chalk.bgYellow.black(`> ${message.body}`));

  const text = message.body.toLowerCase();
  // List fitur bot 
  if (text.includes(".ai")) {
    try {      
      const inputText = text.replace(".ai", "");
      if (!inputText) await client.sendMessage(message.from, `Enter a Question!`)
      message.react(react_loading);
      const chats = await askGPT(inputText);      
      console.log(chalk.bgGreen.black(`> ${chats.result}`));     
      client.sendMessage(message.from, chats.result);
      message.react(react_done);
    } catch (e) {
      console.log(e);
    }
   } else if (text.includes(".c-ai")) {   
    const inputtext = text.replace(".c-ai", "");
    if (!inputtext) await client.sendMessage(message.from, `Example: *.c-ai kirito|hai what is your name?*`);
    let [ prompt1, prompt2 ] = inputtext.split('|')
    if (!prompt1 || !prompt2) {
        await message.reply('Example: *.c-ai kirito|hai what is your name?*');
    } else {       
        message.react(react_loading);
        try {
            const chats = await fetch(BASE_URL + `/ai/c-ai` + `?prompt=${prompt1}` + `&text=${prompt2}`).then(res => res.json());
            console.log(chalk.bgGreen.black(`> ${chats.result}`));
            await client.sendMessage(message.from, chats.result);
            message.react(react_done);
        } catch (e) {
            console.log(e);
        }
      }
    } else if (text.includes(".gptgo")) {
    try {
      const inputText = text.replace(".gptgo", "");
       if (!inputText) await client.sendMessage(message.from, `Enter a Question!`)
       message.react(react_loading);
      const chats = await GptGo(inputText);     
      console.log(chalk.bgGreen.black(`> ${chats.result}`));
      client.sendMessage(message.from, chats.result);
      message.react(react_done);
    } catch (e) {
      console.log(e);
    }
    } else if (text.includes(".dalle")) {
      try {
        const inputText = text.replace(".dalle", "");
         if (!inputText) await client.sendMessage(message.from, `Enter parameter text!`)
        message.react(react_loading);
        const res = await fetch(BASE_URL + `/dalle` + `?text=${encodeURIComponent(inputText)}`).then(response => response.buffer())       
        const response = new MessageMedia((await fromBuffer(res)).mime, res.toString("base64"))
        await client.sendMessage(message.from, response, { caption: `Prompt : ${inputText}` });
        message.react(react_done);
    } catch (e) {
        console.log(e);
    }
    } else if (text.includes(".sticker")) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      if (!quotedMsg) await client.sendMessage(message.from, `Reply image messages with caption .sticker!`)                 
      if (quotedMsg && quotedMsg.hasMedia) {
        message.react(react_loading);
        const media = await quotedMsg.downloadMedia();
        client.sendMessage(message.from, media, { sendMediaAsSticker: true, stickerAuthor: "BOTCAHX", stickerName: "Bot", stickerCategories: ["🗿", "😆"]});
        message.react(react_done);
      }
    } catch (e) {
      console.log(e);
    }
     } else if (text.includes(".removebg")) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      if (!quotedMsg) await client.sendMessage(message.from, `Reply image messages with caption *.removebg*`)                 
      if (quotedMsg && quotedMsg.hasMedia) {
        message.react(react_loading);
        const media = await quotedMsg.downloadMedia();
        const buffer = Buffer.from(media.data, 'base64');
        const cloud = await uploader(buffer)
        const remove = await fetch(BASE_URL + `/removebg` + `?url=${cloud}`).then(response => response.json());
        console.log(chalk.bgGreen.black(`> ${remove.url.result}`));
        const imgs = await fetch(remove.url.result).then(res => res.buffer())
        const response = new MessageMedia((await fromBuffer(imgs)).mime, imgs.toString("base64"))
        await client.sendMessage(message.from, response, { caption: '✔️ Done' });        
        message.react(react_done);
      }
    } catch (e) {
      console.log(e);
    }
      } else if (text.includes(".remini")) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      if (!quotedMsg) await client.sendMessage(message.from, `Reply image messages with caption *.remini*`)                 
      if (quotedMsg && quotedMsg.hasMedia) {
        message.react(react_loading);
        const media = await quotedMsg.downloadMedia();
        const buffer = Buffer.from(media.data, 'base64');
        const cloud = await uploader(buffer)        
        const remini = await fetch(BASE_URL + `/remini` + `?url=${cloud}` + `&resolusi=4`).then(response => response.json());
        console.log(chalk.bgGreen.black(`> ${remini.url.url}`));
        const imgs = await fetch(remini.url.url).then(res => res.buffer())
        const response = new MessageMedia((await fromBuffer(imgs)).mime, imgs.toString("base64"))
        await client.sendMessage(message.from, response, { caption: '✔️ Done' });        
        message.react(react_done);
      }
    } catch (e) {
      console.log(e);
    }
      } else if (text.includes(".tozombie")) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      if (!quotedMsg) await client.sendMessage(message.from, `Reply image messages with caption  *.tozombie*`)                 
      if (quotedMsg && quotedMsg.hasMedia) {
        message.react(react_loading);
        const media = await quotedMsg.downloadMedia();
        const buffer = Buffer.from(media.data, 'base64');
        const cloud = await uploader(buffer)        
        const zombie = await fetch(BASE_URL + `/converter/zombie` + `?url=${cloud}`).then(response => response.json());
        console.log(chalk.bgGreen.black(`> ${zombie.url}`));
        const imgs = await fetch(zombie.url).then(res => res.buffer())
        const response = new MessageMedia((await fromBuffer(imgs)).mime, imgs.toString("base64"))
        await client.sendMessage(message.from, response, { caption: '✔️ Done' });        
        message.react(react_done);
      }
    } catch (e) {
      console.log(e);
    }
      } else if (text.includes(".toanime")) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      if (!quotedMsg) await client.sendMessage(message.from, `Reply image messages with caption *.toanime*`)                 
      if (quotedMsg && quotedMsg.hasMedia) {
        message.react(react_loading);
        const media = await quotedMsg.downloadMedia();
        const buffer = Buffer.from(media.data, 'base64');
        const cloud = await uploader(buffer)        
        const anime = await fetch(BASE_URL + `/toanime` + `?url=${cloud}`).then(response => response.json());
        console.log(chalk.bgGreen.black(`> ${anime.url.img_crop_single}`));
        const imgs = await fetch(anime.url.img_crop_single).then(res => res.buffer())
        const response = new MessageMedia((await fromBuffer(imgs)).mime, imgs.toString("base64"))
        await client.sendMessage(message.from, response, { caption: '✔️ Done' });        
        message.react(react_done);
      }
    } catch (e) {
      console.log(e);
    }
     } else if (text.includes(".tourl")) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      if (!quotedMsg) await client.sendMessage(message.from, `Reply image messages with caption *.tourl*`)                 
      if (quotedMsg && quotedMsg.hasMedia) {
        message.react(react_loading);
        const media = await quotedMsg.downloadMedia();
        const buffer = Buffer.from(media.data, 'base64');
        const cloud = await uploader(buffer)               
await message.reply(`
*Uploader*
MimeType: ${media.mimetype}
Data (length): ${media.data.length}
Preview: ${cloud}`)       
        message.react(react_done);
      }
    } catch (e) {
      console.log(e);
    }
    } else if (text.includes(".text2img")) {
      try {        
        const inputText = text.replace(".text2img", "");
        if (!inputText) await client.sendMessage(message.from, `Enter parameter text!`)
        message.react(react_loading);
        const res = await fetch(BASE_URL + `/ai/text2img` + `?text=${encodeURIComponent(inputText)}`).then(response => response.buffer());      
        const response = new MessageMedia((await fromBuffer(res)).mime, res.toString("base64"))
        await client.sendMessage(message.from, response, { caption: `Prompt : ${inputText}` });
        message.react(react_done);
    } catch (e) {
        console.log(e);
    }    
    } else if (text.includes(".info")) {
    try {
      let info = client.info;
        client.sendMessage(message.from, `
┌ *INFO*
│ ◦ User name: ${info.pushname}
│ ◦ My number: ${info.wid.user}
│ ◦ Platform: ${info.platform}
└
`);
    } catch (e) {
      console.log(e);
    }
     } else if (text.includes(".groups")) {
    try {
        client.getChats().then(chats => {
            const groups = chats.filter(chat => chat.isGroup);

            if (groups.length == 0) {
                message.reply('You have no group yet.');
            } else {
                let replyMsg = '*GROUPS*\n\n';
                groups.forEach((group, i) => {
                    replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
                });
                message.reply(replyMsg);
            }
        });
    } catch (e) {
        console.log(e);
    }
  } else if (text.includes(".menu")) {  // Help Prompt
    const r_menu = `
┌ *MENU*
│ ◦ ai
│ ◦ gptgo
│ ◦ c-ai
│ ◦ dalle
│ ◦ text2img
│ ◦ sticker
│ ◦ remini
│ ◦ toanime
│ ◦ tozombie
│ ◦ removebg
│ ◦ tourl
│ ◦ info
│ ◦ groups
│ ◦ menu
└ `;
    client.sendMessage(message.from, r_menu);
  }
});
