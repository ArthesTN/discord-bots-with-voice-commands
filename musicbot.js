require("dotenv").config();
const { Client, Intents, Collection, VoiceChannel, GuildMember, MessageEmbed } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, VoiceConnection,AudioPlayerStatus } = require('@discordjs/voice');

const { VoiceConnectionStatus, entersState, createAudioPlayer } = require('@discordjs/voice');
const fs = require("fs");
const { Readable } = require('stream');

const ffmpeg = require('ffmpeg');
var exec = require('child_process').exec;
const speech = require('@google-cloud/speech')
const path = require("path")
const voice_1 = require("@discordjs/voice");

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const prism_media_1 = __importDefault(require("prism-media"));
const stream_1 = require("stream");
const ytdl = require('ytdl-core')
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});
const yts = require('yt-search')
const discordbot2 = __dirname
const speechpath = path.join(discordbot2, "speechaudios")
const ethings = path.join(discordbot2, "ethings")
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
client.on('voiceStateUpdate', async( oldState, newState)=>{
    
    
    //console.log(oldState.member.voice.channel)
    //console.log(newState.member.voice.channel)
    if( oldState.member.voice.channel === newState.member.voice.channel){
        console.log(oldState.member.displayName +" voice status changed")
        
        await sleep(200)
        const pcmfilename = path.join("speechaudios", "pcm" + newState.member.id  + ".pcm" )
        if (fs.existsSync(pcmfilename)){
        fs.unlinkSync(pcmfilename, (err)=>{
            if (err) console.log("could not delete pcm file")
        })}
    }
    
} )

const settings = {
    prefix: '!',
};

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
    leaveOnStop: false,
    leaveOnEnd: false,
    deafenOnJoin: false,
    timeout: false,
    
});
var guildTranscriptions = new Map()
// You can define the Player as *client.player* to easily access it.
client.on("ready", () => {
    console.log("Let's Vibe!");
    var deletewavs = path.join(discordbot2, 'deletewavs.py')
    console.log("Successfully connected.");
    exec('python ' + deletewavs, function (err, stdout, stderr) {
        if (err) {
            console.error(stderr);
            console.log("badthings1")
            
        }
        console.log("recordings are deleted")
    });
    
    const Guilds = client.guilds.cache.map(guild => guild.id)
    for (let index = 0; index < Guilds.length; index ++){
        guildTranscriptions.set(Guilds[index], false)
    }
    
    console.log(guildTranscriptions)
});
client.player = player
const { RepeatMode } = require('discord-music-player');

client.on('messageCreate', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    let guildQueue = client.player.getQueue(message.guild.id);
    const memberRequester = message.member
    if(command === 'play') {
        
        await play(message, args.join(' '), memberRequester)  
        
    }

    if(command === 'playlist') {
        let queue = client.player.createQueue(message.guild.id );
        queue.setData({
            queueInitMessage: message
        });
        
        await queue.join(message.member.voice.channel);
        let playlist = await queue.playlist(args.join(' ')).catch(_ => {
            if(!guildQueue)
                queue.stop();
        });
        
        if(playlist!== undefined){
            for (var i = 0; i < playlist.songs.length; i++){
                playlist.songs[i]["requestedBy"] = message.member
                console.log(playlist.songs[i].requestedBy)
            }
        }
    }

    if(command === 'skip') {
        await skip(message, memberRequester)
    }

    if(command === 'leave') {
        await leaveChannel(message)
    }

    if(command === 'removeloop') {
        guildQueue.setRepeatMode(RepeatMode.DISABLED); // or 0 instead of RepeatMode.DISABLED
    }

    if(command === 'toggleloop') {
        guildQueuefix = -1
        guildQueue.setRepeatMode(RepeatMode.SONG); // or 1 instead of RepeatMode.SONG
    }

    if(command === 'togglequeueloop') {
        guildQueue.setRepeatMode(RepeatMode.QUEUE); // or 2 instead of RepeatMode.QUEUE
    }

    if(command === 'setvolume') {
        guildQueue.setVolume(parseInt(args[0]));
    }

    if(command === 'seek') {
        guildQueue.seek(parseInt(args[0]) * 1000);
    }

    if(command === 'clearqueue') {
        await clearQueue(message, memberRequester)
    }

    if(command === 'shuffle') {
        await shuffle(message, memberRequester)
    }

    if(command === 'queue') {
        const page = parseInt(args[0])
        await getQueue(message, page, memberRequester)
    }

    if(command === 'getvolume') {
        console.log(guildQueue.volume)
    }

    if(command === 'nowplaying') {
        console.log(`Now playing: ${guildQueue.nowPlaying}`);
    }

    if(command === 'pause') {
        await pause_playing(message, memberRequester)
    }

    if(command === 'resume') {
        await unpause_playing(message, memberRequester)
    }

    if(command === 'remove') {
        guildQueue.remove(parseInt(args[0]));
    }

    if(command === 'createprogressbar') {
        const ProgressBar = guildQueue.createProgressBar();
        
        // [======>              ][00:35/2:20]
        console.log(ProgressBar.prettier);
    }
    if(command === 'join'){
        await connectToChannel( message);
    }
    if(command === 'skipto'){
        skipTo(message, parseInt(args[0]), memberRequester)
    }
    if(command === "write2"){
        if (!guildTranscriptions.has(message.guild.id)){
            guildTranscriptions.set(message.guild.id, false)
        }
        toggleBool = !guildTranscriptions.get(message.guild.id)
        guildTranscriptions.set(message.guild.id, toggleBool)
        console.log(guildTranscriptions)
    }
    if(command === 'help'){
        help(message)
    }
})
async function leaveChannel(message){
    if(!message.guild.me.voice.channel) return message.channel.send("I'm not in a voice channel"); //If the bot is not in a voice channel, then return a message
    let queue = client.player.getQueue(message.guild.id);
    const voiceConnection = queue.connection.connection
    voiceConnection.destroy()

}    
async function connectToChannel(message) {
    if (!message.member.voice.channel){
        message.channel.send("get in vc")
        return
    }
    let queue = client.player.createQueue(message.guild.id);
	await queue.join(message.member.voice.channel);
    //queue.StreamConnection.VoiceConnection
    const voiceConnection = queue.connection.connection
    console.log(queue)
    console.log(voiceConnection)
    stream2pcm(voiceConnection, message)
}
async function stream2pcm(voiceConnection, message){
    const user = message.member
    const _user = client.users.resolveId(user);
    voiceConnection.receiver.speaking.on('start', userId => {
        if (userId === userId) {
            //console.log(userId)
            const passThrough = new stream_1.PassThrough();
            const opusStream = voiceConnection.receiver.subscribe(userId, {
                end: {
                    behavior: voice_1.EndBehaviorType.AfterSilence,
                    duration: 100
                }
            });
            const pcmStream = new prism_media_1.default.opus.Decoder({
                channels: 2,
                frameSize: 960,
                rate: 48000
            })
           
            setImmediate(() => {    
            opusStream.pipe(pcmStream);
            pcmStream.pipe(passThrough);})
            
            const pcmfilename = path.join(speechpath,`pcm${userId}.pcm`)
            const wavfilename = path.join(speechpath,`wav${userId}.wav`)
            const txtfilename = path.join(speechpath,`txt${userId}.txt`)
            fs.writeFile(txtfilename, "", (err) => {
                if (err) throw err;
            })
            //console.log("stream2pcm")
            stream2file(passThrough, voiceConnection, user, message,pcmfilename, wavfilename, txtfilename, userId)

        }
        
    })
}
async function stream2file(passThrough, voiceConnection, user, message, pcmfilename, wavfilename, txtfilename, userId){
    
    const writer = passThrough.pipe(fs.createWriteStream(pcmfilename));
            
             await writer.once("finish", () => {
                
                exec('ffmpeg -f s16le -ar 44.1k -ac 2 -i ' + pcmfilename + ' ' + wavfilename, function (err, stdout, stderr) {
                    if (err) {
                        console.error(stderr);
                        console.log("stream2file1")
                    }
                  
                    pythonspeech(voiceConnection, user, message, pcmfilename, wavfilename, txtfilename, userId)
                       
                    
                    });
                
               
            })
}
async function pythonspeech(voiceConnection, user, message, pcmfilename, wavfilename, txtfilename, userId){
    const convert1 = path.join(discordbot2, 'convert1.py')
    exec('python ' + convert1 + ' ' + wavfilename + ' ' + txtfilename, function (err, stdout, stderr) {
        if (err) {
            console.error(stderr);
            console.log("badthings1")
            
        }
        console.log(stdout);
        fs.readFile(txtfilename, 'utf8', (err, data)=>{
            if (err){
                console.log(err);
                console.log("badthings")    
            }  
            
            const member = message.guild.members.cache.get(userId)
            if (data.length > 0){
                console.log(member.displayName + ": " + data)}
                if (guildTranscriptions.get(message.guild.id) === true){
                    message.channel.send(member.displayName + ": " + data)
                }
           
            voicecommands(voiceConnection, user, message, data, userId).then(value =>{ 
                if (fs.existsSync(wavfilename)){
                    fs.unlinkSync(wavfilename, (err)=>{
                        if (err) console.log("could not delete wav file")
                    })} 
                
                fs.writeFileSync(txtfilename,"", (err) => {
                    if (err){
                      console.log("could not wipe txt file");
                    }
                    fs.closeSync(txtfilename).then(value => {
                        fs.closeSync(pcmfilename)
                    })
                }      
                );               
            })      
        })        
    });
    
}

async function voicecommands(voiceConnection, user, message, transcribe, userId){
    const memberRequester = message.guild.members.cache.get(userId)
    const requesterName = memberRequester.displayName
    transcribe = transcribe.toLowerCase()
    if (transcribe.includes("play music")){
        const start = transcribe.lastIndexOf("play music")
        const splicing = transcribe.slice(start + 10, transcribe.length)
        play(message, splicing, memberRequester)
    }
    if (transcribe.includes("stop song") || transcribe.includes("stop music") || transcribe.includes("stop the music")){
        clearQueue(message, memberRequester)
    }
    if (transcribe.includes("pause the music") || transcribe.includes("time out") || transcribe.includes("timeout")){
        pause_playing(message, memberRequester)
    }
    if (transcribe.includes("resume the music") || transcribe.includes("unpause the music") || transcribe.includes("continue the music")){
        unpause_playing(message, memberRequester)
    }
    if (transcribe.includes("shuffle the music")){
        shuffle(message, memberRequester)
    }
    if (transcribe.includes("skip to song number")){
        const l = "skip to song number".length
        const start = transcribe.lastIndexOf("skip to song number")
        const splicing = transcribe.slice(start + l, transcribe.length)
        skipTo(message, splicing, memberRequester)
    }
    if (transcribe.includes("skip this song")){
        skip(message, memberRequester)
    }
    
}
async function help(message){
    const exampleEmbed = new MessageEmbed()
      
      .setTitle("Commands")
      
      .addFields(
          {name: "play {song}",value: "voice: play music"},
          {name: "playlist {playlist link}",value: "voice:"},
          {name: "clearQueue",value: "voice: stop song, stop music, stop the music"},
          {name: "pause",value: "voice: pause the music, time out, timeout"},
          {name: "resume",value: "voice: resume the music, unpause the music, continue the music"},
          {name: "shuffle",value: "voice: skip this song"},
          {name: "skip",value: "voice: shuffle the music"},
          {name: "skipto {number}",value: "voice: skip to song number"},
          {name: "join",value: "voice:"},
          {name: "leave",value: "voice:"},
          {name: "write2", value: "toggle the transcription of voices"}
          
      )
      
      
      message.channel.send({embeds: [exampleEmbed]})
}

async function getQueue(message,page, memberRequester){
    let queue = client.player.getQueue(message.guild.id);
    if(queue.songs.length < 1){
        return await message.channel.send("There are no songs in the playlist")
    }
    const totalPages = Math.ceil(queue.songs.length / 10) || 1
    if (!page){
        page = 0
    }
    else{
        page = page -1
    }
    if (page > totalPages) 
            return await message.channel.send(`Invalid Page. There are only a total of ${totalPages} pages of songs`)
    
    const queueString = queue.songs.slice(page * 10, page * 10 + 10).map((Song, i) => {
            return `**${page * 10 + i + 1}.** \`[${Song.duration}]\` ${Song.name} -- <@${Song.requestedBy.id}>`
        }).join("\n")
    const currentSong = queue.songs[0]
    await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setDescription(`**Currently Playing**\n` +
                    (currentSong ? `\`[${currentSong.duration}]\` ${currentSong.name} -- <@${currentSong.requestedBy.id}>` : "None") +
                    `\n\n**Queue**\n${queueString}`
                    )
                    .setFooter({
                        text: `Page ${page + 1} of ${totalPages}`
                    })
                    .setThumbnail(currentSong.setThumbnail)
            ]
        })
}
async function skip(message, memberRequester){
    let queue = client.player.getQueue(message.guild.id);
    queue.skip()
    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Into the Future`)
    await message.channel.send({ embeds: [exampleEmbed] })
    //await getQueue(message, 1, memberRequester)
}
async function play(message, splicing, memberRequester){
    
    let queue = client.player.createQueue(message.guild.id
        );
    queue.setData({
        queueInitMessage: message
    });
    //console.log(queue.data)
    await queue.join(message.member.voice.channel);
    let song = await queue.play(splicing).catch(_ => {
        if(!queue)
            queue.stop();
    });
    if (song !==  undefined) {
        song["requestedBy"] = memberRequester
        console.log(song.name)
    }
}
async function clearQueue(message, memberRequester){
    let guildQueue = client.player.getQueue(message.guild.id);
    if(guildQueue.songs.length > 0){
    guildQueue.clearQueue();
    guildQueue.skip()

    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Music is No More`)
    .setThumbnail("https://i.kym-cdn.com/entries/icons/mobile/000/024/599/jazz.jpg")
    message.channel.send({ embeds: [exampleEmbed] });
    }
    
}
async function pause_playing(message, memberRequester){
    let guildQueue = client.player.getQueue(message.guild.id);
    if(guildQueue.isPlaying && guildQueue.connection.paused === false){
    guildQueue.setPaused(true);
    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Music Paused`)
    .setThumbnail("https://c.tenor.com/56gRizUWsDUAAAAC/pause-time-out.gif")
    message.channel.send({ embeds: [exampleEmbed] })}
}

async function unpause_playing(message,  memberRequester){
    let guildQueue = client.player.getQueue(message.guild.id);
    console.log(typeof guildQueue)
    console.log(guildQueue.songs.length)
    if(guildQueue.isPlaying && guildQueue.connection.paused === true){
    guildQueue.setPaused(false);
    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Music Unpaused`)
    .setThumbnail("https://c.tenor.com/1lAVaFLAuQcAAAAC/go-on-pulp-fiction-samueel-l-jackson.gif")
    message.channel.send({ embeds: [exampleEmbed] })}
}
async function shuffle(message, memberRequester){
    let guildQueue = client.player.getQueue(message.guild.id);
    if(guildQueue.isPlaying){
    guildQueue.shuffle();
    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Music Shuffled`)
    message.channel.send({ embeds: [exampleEmbed] })}
}
async function skipTo(message, splicing, memberRequester){
    console.log(splicing)
    splicing = parseInt(splicing)
    if (splicing >0){
        splicing = splicing - 1
    }
    let guildQueue = client.player.getQueue(message.guild.id);
    if (guildQueue.songs.length < splicing ||  !guildQueue.isPlaying) {
        return
    }
    
    guildQueue.songs.splice(0, splicing - 1)
    await skip(message, memberRequester)
    
    
}

client.player
    // Emitted when channel was empty.
    .on('channelEmpty',  (queue) =>
        console.log(`Everyone left the Voice Channel, queue ended.`))
    // Emitted when a song was added to the queue.
    .on('songAdd',  (queue, song,) =>
        console.log(`Song ${song} was added to the queue.`))
    // Emitted when a playlist was added to the queue.
    .on('playlistAdd',  (queue, playlist) =>
        console.log(`Playlist ${playlist} with ${playlist.songs.length} was added to the queue.`))
    // Emitted when there was no more music to play.
    .on('queueDestroyed',  (queue) =>
        console.log(`The queue was destroyed.`))
    // Emitted when the queue was destroyed (either by ending or stopping).    
    .on('queueEnd',  (queue) =>
        console.log(`The queue has ended.`))
    // Emitted when a song changed.
    .on('songChanged', (queue, newSong, oldSong) =>
        {
        const song  = newSong
        const memberRequester = song.requestedBy
        const requesterName = memberRequester.displayName
        const message =  queue.data.queueInitMessage
        
        const exampleEmbed = new MessageEmbed()
        .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
        .setDescription(`Playing [${song.name}](${song.url})`)
        .setThumbnail(song.thumbnail)
        
        .setFooter({ text: `Duration: ${song.duration}`})
        message.channel.send({ embeds: [exampleEmbed] });
        })
    // Emitted when a first song in the queue started playing.
    .on('songFirst',  (queue, song) =>
        {
            const memberRequester = song.requestedBy
            const requesterName = memberRequester.displayName
            const message =  queue.data.queueInitMessage
            console.log(queue.data.queueInitMessage.content)
            const exampleEmbed = new MessageEmbed()
            .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
            .setDescription(`Playing [${song.name}](${song.url})`)
            .setThumbnail(song.thumbnail)
            
            .setFooter({ text: `Duration: ${song.duration}`})
            message.channel.send({ embeds: [exampleEmbed] });  
            
        })
    // Emitted when someone disconnected the bot from the channel.
    .on('clientDisconnect', (queue) =>
        console.log(`I was kicked from the Voice Channel, queue ended.`))
    // Emitted when deafenOnJoin is true and the bot was undeafened
    .on('clientUndeafen', (queue) =>
        console.log(`I got undefeanded.`))
    // Emitted when there was an error in runtime
    .on('error', (error, queue) => {
        console.log(`Error: ${error} in ${queue.guild.name}`);
    });
client.login(process.env.DISCORD_TOKEN2);
