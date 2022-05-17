ABOUT: Implement voice commands for discord bots

Installation:

npm install

pip install ffmpeg

pip install SpeechRecognition

Create an .env file

Create a file named "names.json"

Create a file named "vcnames.json"

API Keys:

Get two Discord Bot Tokens and one OpenWeather API key, Google Cloud Speech optional

Bots:

musicbot.js:

purely made to play music

songs are stored in a queue

soundeffectbot.js:

certain phrases trigger a sound effect

interact with users and voice channel by giving them nicknames to be called upon in the voice commands

!membername {user} {nickname}

!vcname {voice channel id} {nickname}

Can mute, unmute, deafen, undeafen, transfer, disconnect users

Can check the weather of cities around the world

Can toggle transcription to know how the bot is registering your words

message "!help" for command list
