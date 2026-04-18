you need a .env file with:
TOKEN=(BOT TOKEN)
YOUTUBE_COOKIE=SID=(SID Cookie); HSID=(HSID cookie); SSID=(SSID cookie); APISID=(APISID cookie); SAPISID=(SAPISID Cookie);

You also need config.json with:
{
  "token": "BOT_TOKEN",
  "clientId": "BOT_ID",
  "guildId": "SERVER_ID"
}

run in cmd:
winget install yt-dlp
winget install ffmpeg


Now you can use export cookies extension to simply get the cookies from youtube and put it in the discord-music-bot folder named cookies-youtube-com.txt
