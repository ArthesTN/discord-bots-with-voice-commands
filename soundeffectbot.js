require("dotenv").config();
const { Client, Intents, Collection, VoiceChannel, GuildMember, MessageEmbed } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, VoiceConnection,AudioPlayerStatus } = require('@discordjs/voice');
const https = require("https");
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
const settings = {
    prefix: '!',

};
const prism_media_1 = __importDefault(require("prism-media"));
const stream_1 = require("stream");
const ytdl = require("discord-ytdl-core");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});
const yts = require('yt-search');
const { create } = require("domain");
const discordbot2 = __dirname
const speechpath = path.join(discordbot2, "speechaudios")
const ethings = path.join(discordbot2, "ethings")
var guildTranscriptions = new Map()
client.on("ready", () => {
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
})
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





client.on('messageCreate', async (message) => {
	const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    
	if (command === 'j') {
		const channel = message.member?.voice.channel;
		if (channel) {
			try {
				const connection = await connectToChannel(channel, message);
				
			} catch (error) {
				console.error(error);
			}
		} 
		
	}

    if (command === 'l'){
        await leaveChannel(message)
    }
    if (command ==='membername'){
        await naming(message)
    }
    if (command==='vcname'){
        await vcnaming(message)
    }
    if(command=== "undeafen"){
    const member= message.mentions.members.first()
    await undeafen(member)
    }
    if(command==="unmute"){
        const member= message.mentions.members.first()
        await unmute(member)
    }
    if (command === "weather"){
        const location = args.join(" ")
        weather(location, message)
    }
    if(command === "write1"){
        if (!guildTranscriptions.has(message.guild.id)){
            guildTranscriptions.set(message.guild.id, false)
        }
        toggleBool = !guildTranscriptions.get(message.guild.id)
        guildTranscriptions.set(message.guild.id, toggleBool)
        console.log(guildTranscriptions)
    }
    if (command === "help"){
        await help(message)
    }

    
});


function namesdata(){
    var namedict;
    const names = path.join(discordbot2, 'names.json')
    const f =  fs.readFileSync(names, 'utf8')
    namedict = JSON.parse(f)
    return namedict
}
function vcnamesdata(){
    var vcnamedict;
    const vcnames = path.join(discordbot2, 'vcnames.json')
    const f =  fs.readFileSync(vcnames, 'utf8')
    vcnamedict = JSON.parse(f)
    return vcnamedict
}
async function leaveChannel(message){
    if(!message.guild.me.voice.channel) return message.channel.send("I'm not in a voice channel"); //If the bot is not in a voice channel, then return a message
    const connection = getVoiceConnection(message.guild.id)
    connection.destroy()

}
async function connectToChannel(channel,message) {
    
	const voiceChannel = message.member.voice.channel;
    //console.log(voiceChannel)
    const voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf:false,
        selfMute:false
    });
    message.channel.send("joining")
    stream2pcm(voiceConnection, message)
}
async function stream2pcm(voiceConnection, message){
    
    user = message.member
    
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
                /*if (fs.existsSync(wavfilename)){
                    try {
                        fs.unlinkSync(wavfilename);
                        //console.log("File removed:", "file.wav");
                        
                      } catch (err) {
                        console.error(err);
                        console.log("stream2file1")
                      }
                
                }*/
                exec('ffmpeg -f s16le -ar 44.1k -ac 2 -i ' + pcmfilename + ' ' + wavfilename, function (err, stdout, stderr) {
                    if (err) {
                        console.error(stderr);
                        console.log("stream2file1")
                    }
                   /* const player = voice_1.createAudioPlayer();
                const resource = voice_1.createAudioResource(wavfilename)
                player.play(resource)
                voiceConnection.subscribe(player)*/
                // ffmpeg -f s16le -ar 44.1k -ac 2 -i pcm399746255024029697.pcm wav399746255024029697.wav
                    pythonspeech(voiceConnection, user, message, pcmfilename, wavfilename, txtfilename, userId)
                       
                    
                    });
                
                //sleep(100)
                
                //googlespeech(pcmfilename, message, user, voiceConnection)   
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
                fs.unlinkSync(wavfilename, (err)=>{
                    if (err) console.log("could not delete wav file")
                })
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
    
    if (transcribe.includes("let's go")){
        
        dababy(voiceConnection)
    }
    
    if (transcribe.includes("chilling")){
        bing_chilling(voiceConnection)
    }
    if (transcribe.includes("crazy")){
        crazy(voiceConnection)
    }
    if (transcribe.includes("mad")){
        mad(voiceConnection)
    }
    if (transcribe.includes("kill him")){
        finish_him(voiceConnection)
    }
    if (transcribe.includes("we go again")){
        we_go_again(voiceConnection)
    }
    if (transcribe.includes("good time")){
        good_time(voiceConnection)
    }
    if (transcribe.includes("moan")){
        moan(voiceConnection)
    }
    
    if (transcribe.includes("surprise")){
        surprise(voiceConnection)
    }
    if (transcribe.includes("you fail")){
        you_fail(voiceConnection)
    }
    if (transcribe.includes("what are you doing")){
        what_r_u_doing(voiceConnection)
    }
    if (transcribe.includes("sasageyo")){
       sasageyo(voiceConnection)
    }
    if (transcribe.includes("spy") || transcribe.includes("traitor") ){
        spy(voiceConnection)
     }
    if (transcribe.includes("don't do it") || transcribe.includes("do not do it") ){
        stop(voiceConnection)
    }
    

    if (transcribe.includes("begone") && !transcribe.includes("begone everyone") ){
        const start = transcribe.lastIndexOf("begone")
        const splicing = transcribe.slice(start, transcribe.length)
        console.log(splicing)
        
        var dict = namesdata()
        var dictkeys = Object.keys(dict)
        for (let nameindex = 0;  nameindex< dictkeys.length; nameindex++){
            if (splicing.includes(dictkeys[nameindex])){
                const alias = dictkeys[nameindex]
                const id = dict[dictkeys[nameindex]]['id']
                const member = message.guild.members.cache.get(id)
                console.log(alias)
                console.log(member)
                disconnect(member)
            }
        }

    }
    if (transcribe.includes("begone everyone")){
        const channel = message.guild.me.voice.channel
        channel.members.forEach(element => disconnect(element));

    
   
        

    }
    if (transcribe.includes("transfer") && !transcribe.includes("transfer everyone"))
    {
        const member = findMember(transcribe, "transfer", message)
        
        const channel = findVoiceChannel(transcribe, "transfer", message)
        if(member != null && channel !=null){
            transfer(member, channel)
        }
    }
    if (transcribe.includes("transfer everyone"))
    {
        const curr = message.guild.me.voice.channel
        
        const dest = findVoiceChannel(transcribe, "transfer everyone", message)
        
        console.log(dest)
        if(dest !=null){
            curr.members.forEach(element => transfer(element, dest));
        }
    }
    if (transcribe.includes("silence")){
        const member = findMember(transcribe, "silence", message)
        if( member !=  null){
            mute(member)
        }

    }
    if (transcribe.includes("get the voice")){
        const member = findMember(transcribe, "get the voice", message)
        if( member !=  null){
            unmute(member)
        }

    }
    if (transcribe.includes("close the ears")){
        const member = findMember(transcribe, "close the ears", message)
        if( member !=  null){
            deafen(member)
        }

    }
    if (transcribe.includes("listen to")){
        const member = findMember(transcribe, "listen to", message)
        if( member !=  null){
            undeafen(member)
        }
    }
    if (transcribe.includes("don't die") || transcribe.includes("do not die") ){
        die(voiceConnection)
    }
    if (transcribe.includes("you are dead") || transcribe.includes("you're dead") ||
    transcribe.includes("you are so dead") || transcribe.includes("you're so dead")){
        dead(voiceConnection)
    }
    if (transcribe.includes("shut up") ){
        quiet(voiceConnection)
    }
    if (transcribe.includes("bye") ){
        bye(voiceConnection)
    }
    // MUSIC Commands
    /*if (transcribe.includes("play song") || transcribe.includes("Play song")){
        play(voiceConnection, user, message, transcribe, userId)
    }
    if (transcribe.includes("stop song") || transcribe.includes("stop music") ){
        stop_playing(voiceConnection, user, message, transcribe, userId)
    }
    if (transcribe.includes("pause") && !transcribe.includes("unpause") || transcribe.includes("time out") || transcribe.includes("timeout")){
        pause_playing(voiceConnection, user, message, transcribe, userId)
    }
    if (transcribe.includes("resume the music") || transcribe.includes("unpause the music") || transcribe.includes("continue the music")){
        unpause_playing(voiceConnection, user, message, transcribe, userId)
    }*/
    if (transcribe.includes("weather")){
        const start = transcribe.lastIndexOf("weather")
        const splicing = transcribe.slice(start + "weather".length + 1, transcribe.length)
        console.log(splicing)
        weather(splicing, message)
    }
    
   
}
async function help(message){
    const exampleEmbed = new MessageEmbed()
      
      .setTitle("Commands")
      
      .addFields(
      {name: "Message commands", value: "\u200b" },
      {name: "j", value: "join the channel"},
      {name: "l", value: "leave the channel"},
      {name: "write1", value: "toggle the transcription of voices"},
      {name: "membername {mention user} {nickname}", value: "nickname a user to be called in vc"},
      {name: "vcname {channel id} {nickname}", value: "nickname a channel to be called in vc"},
      {name: "undeafen {mention user}", value: "undeafen a user"},
      {name: "unmute {mention user}", value: "unmute a user"},
      {name: "weather {city}", value: "voice: weather {city}"},
      {name: "EXCLUSIVE VOICE COMMANDS", value: "Say these phrases to see what happen"},
      {name: "sound effects", value: "chilling, bye, crazy, let's go, you are dead, don't die, finish him, good time, mad, moan, shut up, sasageyo, spy, don't do it, surprise, we go again, what are you doing, you fail"},
      {name: "Interactions", value: "\u200b"},
      {name: "disconnect a user", value: "begone {user nickname}"},
      {name: "disconnect everyone", value: "begone everyone"},
      {name: "transfer a user to another vc", value: "transfer {user nickname} {voice channel nickname}"},
      {name: "transfer everyone to another vc", value: "transfer everyone {voice channel nickname}"},
      {name: "mute a user", value: "silence {user nickname}"},
      {name: "unmute a user", value: "get the voice {user nickname}"},
      {name: "deafen a user", value: "close the ears {user nickname}"},
      {name: "undeafen a user", value: "listen to {user nickname}"},
      {name: "Examples", value: "\u200b"},
      {name:"!membername @john grass eater", value: "\u200b"},
      {name:"!vcname 614296015964471269 cage", value: "\u200b"},
      {name:"in Voice Channel say: transfer grass eater to the cage", value: "\u200b"},
      )
      
      
      message.channel.send({embeds: [exampleEmbed]})
}
async function weather(location,message){
    const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + location +  '&appid=' + process.env.weatherAPIKey
   
https.get(url, res => {
    console.log("good")
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      data = JSON.parse(data);
      console.log(data)
      if (data.cod === '400' || data.cod === '404' ){
          message.channel.send("could not find city")
          return
          }
      const exampleEmbed = new MessageEmbed()
      
      .setTitle(data.name + ", " + data.sys.country)
      .setDescription(data.weather[0].description)
      .setThumbnail('https://openweathermap.org/img/w/' + data.weather[0].icon + '.png')
      .addFields(
          {name: "Temperature: " +  Math.round(data.main.temp - 273.15).toString() + "\u00B0 C",value: "\u200b"},

          {name: "wind", value: data.wind.speed.toString() + " kmh", incline: true },
          {name: "humidity", value: data.main.humidity.toString() + "%", incline: true },
          {name: "visibility", value: (data.visibility / 1000).toFixed(1).toString() + " km", incline: true }
      )
      
      .setTimestamp()
      message.channel.send({embeds: [exampleEmbed]})
    })
  }).on('error', err => {
    console.log(err.message);
  })
}
var playSong;
async function unpause_playing(voiceConnection, user, message, transcribe, userId){
    if (playSong !== undefined){
    if (playSong.state.status === AudioPlayerStatus.Paused){
    playSong.unpause()
    const memberRequester = message.guild.members.cache.get(userId)
    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Music Unpaused`)
    .setThumbnail("https://c.tenor.com/1lAVaFLAuQcAAAAC/go-on-pulp-fiction-samueel-l-jackson.gif")
    message.channel.send({ embeds: [exampleEmbed] });}}
}
async function pause_playing(voiceConnection, user, message, transcribe, userId){
    if (playSong !== undefined){
    if (playSong.state.status === AudioPlayerStatus.Playing){
    playSong.pause()
    const memberRequester = message.guild.members.cache.get(userId)
    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Music Paused`)
    .setThumbnail("https://c.tenor.com/56gRizUWsDUAAAAC/pause-time-out.gif")
    message.channel.send({ embeds: [exampleEmbed] })}}
}
async function stop_playing(voiceConnection, user, message, transcribe, userId){
    
    if (playSong !== undefined){
    
    if (playSong.state.status === AudioPlayerStatus.Playing){
    playSong.stop()
    playSong = null
    const memberRequester = message.guild.members.cache.get(userId)
    const requesterName = memberRequester.displayName
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Music Stopped`)
    .setThumbnail("https://i.kym-cdn.com/entries/icons/mobile/000/024/599/jazz.jpg")
    
    message.channel.send({ embeds: [exampleEmbed] });}}
}
async function play(voiceConnection, user, message, transcribe, userId){
    
    const start = transcribe.lastIndexOf("play music")
    const splicing = transcribe.slice(start + 10, transcribe.length)
    if (splicing.length ===0){
        return
    }
    const song = (await yts(splicing)).videos[0]
    console.log(song)
    //begin time is not reliable
    var beginTime = "0s"
    if (song.videoId === "dQw4w9WgXcQ"){
        console.log("rick roll")
        beginTime = "43s"
    }
    const url = song.url
    const stream = ytdl(url,  {filter: 'audioonly',
    quality: "highestaudio",
    highWaterMark: 1 << 25,
    dlChunkSize: 0,
    begin: beginTime,
    opusEncoded: true,
    encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']});

    const player = voice_1.createAudioPlayer()
    playSong = player
    const resource  = voice_1.createAudioResource(stream)
    player.play(resource)
    voiceConnection.subscribe(player)
    const memberRequester = message.guild.members.cache.get(userId)
    const requesterName = memberRequester.displayName
    console.log(requesterName)
    console.log(memberRequester)
    console.log(memberRequester.displayAvatarURL)
    const exampleEmbed = new MessageEmbed()
    .setAuthor({ name: requesterName, iconURL: memberRequester.displayAvatarURL({ dynamic: true })})
    .setDescription(`Playing [${song.title}](${song.url})`)
    .setThumbnail(song.thumbnail)
    
    .setFooter({ text: `Duration: ${song.duration}`})
    message.channel.send({ embeds: [exampleEmbed] });
}
async function bye(voiceConnection){
    voiceEffect(voiceConnection, "bye")
}
async function quiet(voiceConnection){
    voiceEffect(voiceConnection, "quiet")
}
async function dead(voiceConnection){
    voiceEffect(voiceConnection, "dead")
}
async function die(voiceConnection){
    voiceEffect(voiceConnection, "die")
}
async function spy(voiceConnection){
    voiceEffect(voiceConnection, "spy")
}
async function stop(voiceConnection){
    voiceEffect(voiceConnection, "stop")
}
async function sasageyo(voiceConnection){
    voiceEffect(voiceConnection, "sasageyo")
}
async function what_r_u_doing(voiceConnection){
    voiceEffect(voiceConnection, "what_r_u_doing")
}
async function you_fail(voiceConnection){
    voiceEffect(voiceConnection, "you_fail")
}
async function surprise(voiceConnection){
    voiceEffect(voiceConnection, "surprise")
}
async function dababy(voiceConnection){
    voiceEffect(voiceConnection, "dababy")
}
async function bing_chilling(voiceConnection){
    voiceEffect(voiceConnection, "bing_chilling")
}
async function mad(voiceConnection){
    voiceEffect(voiceConnection, "mad")
}
async function crazy(voiceConnection){
    voiceEffect(voiceConnection, "crazy")
}
async function finish_him(voiceConnection){  
    voiceEffect(voiceConnection, "finish_him")
}
async function we_go_again(voiceConnection){
    voiceEffect(voiceConnection, "we_go_again")
}
async function voiceEffect(voiceConnection, sounddirectory){
    const directory = path.join(ethings, sounddirectory)
    
    const dir = fs.readdirSync(directory)
    
    const rand = Math.floor(Math.random() * dir.length)
    
    const file = path.join(directory, dir[rand])
    const player = voice_1.createAudioPlayer()
    playSong = player
    const resource  = voice_1.createAudioResource(file)
    player.play(resource)
    voiceConnection.subscribe(player)
    
}
async function good_time(voiceConnection){
    voiceEffect(voiceConnection, "good_time")
}
async function moan(voiceConnection){
    voiceEffect(voiceConnection, "moan")
}

function findVoiceChannel(transcribe, keyword, message){
    const start = transcribe.lastIndexOf(keyword)
    
    const splicing = transcribe.slice(start, transcribe.length)
    var channeldict = vcnamesdata()
    var vcdictkeys = Object.keys(channeldict)
    for (let vcindex = 0;  vcindex< vcdictkeys.length; vcindex++){
        
        if (splicing.includes(vcdictkeys[vcindex])){
            
            const vcalias = vcdictkeys[vcindex]
            const vcid =  channeldict[vcalias]["id"]
            const channel= message.guild.channels.cache.get(vcid)
            
            return channel
            
        }
    }

}
function findMember(transcribe, keyword, message){

    const start = transcribe.lastIndexOf(keyword)
    
    const splicing = transcribe.slice(start, transcribe.length)
        
        
    var dict = namesdata()
    var dictkeys = Object.keys(dict)
    for (let nameindex = 0;  nameindex< dictkeys.length; nameindex++){
        if (splicing.includes(dictkeys[nameindex])){
            
            const alias = dictkeys[nameindex]
            const id = dict[alias]['id']
            const member = message.guild.members.cache.get(id)
            console.log(member)
            return member
        }
    }
   

}
async function deafen(member){
    member.voice.setDeaf()
}
async function undeafen(member){
    member.voice.setDeaf(false)
}
async function mute(member){
    member.voice.setMute()
}
async function unmute(member){
    member.voice.setMute(false)
}
async function transfer(member, channel){
    member.voice.setChannel(channel);
}
async function naming(message){
    const member= message.mentions.members.first()
    console.log(member)
    
    
    const str = message.toString().toLowerCase().split(" ")
    var alias = ""
    for (let w = 2; w < str.length; w++){
        if (w < str.length - 1){
        alias = alias + str[w] + " "}
        else{
            alias = alias + str[w]
        }

    }
    console.log(alias)
    
    const names = path.join(discordbot2, "names.json")
    fs.readFile(names, 'utf8', (err, data)=>{
        if (err){
            console.log(err);
            console.log("badthings")    
        }
        var dict = JSON.parse(data)
        var v = []
        var b = {}
    
        b.name = member.displayName
        b.id = member.id
        //console.log(b)
        v.push({alias : b})
        dict[alias] = b
        var newdata = JSON.stringify(dict)
        console.log(dict)
        fs.writeFileSync(names, newdata)
    
        
        
    })

}
async function vcnaming(message){

 
    
    
    const str = message.toString().toLowerCase().split(" ")
    console.log(str)
    const id = str[1]
    console.log(id)
    var alias = ""
    for (let w = 2; w < str.length; w++){
        if (w < str.length - 1){
        alias = alias + str[w] + " "}
        else{
            alias = alias + str[w]
        }

    }
    const channel= message.guild.channels.cache.get(id)
    console.log(channel)


    console.log(alias)
    const vcnames = path.join(discordbot2, "vcnames.json")
    fs.readFile(vcnames, 'utf8', (err, data)=>{
        if (err){
            console.log(err);
            console.log("badthings")    
        }
        var dict = JSON.parse(data)
        var v = []
        var b = {}
    
        b.channel = channel
        b.id = channel.id
            //console.log(b)
        v.push({alias : b})
        dict[alias] = b
        var newdata = JSON.stringify(dict)
        console.log(dict)
        fs.writeFileSync(vcnames, newdata)
        
        
        
    
        
        
    })

}
async function disconnect(member){
    member.voice.disconnect()
}

//async function transfer(member, channel)

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }












async function googlespeech(pcmfilename, message, user, voiceConnection)  {
    var file = path.join(discordbot2, "discordgooglekey.json")
    const client = new speech.SpeechClient({
        keyFilename: file
    });

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
 const filename = pcmfilename;
 const encoding = 'LINEAR16'; 
 const sampleRateHertz = 44100;
 const languageCode = 'en-US';

const config = {
  encoding: encoding,
  sampleRateHertz: sampleRateHertz,
  languageCode: languageCode,
  audioChannelCount: 2,
  enableSeparateRecognitionPerChannel: true
};

/**
 * Note that transcription is limited to 60 seconds audio.
 * Use a GCS file for audio longer than 1 minute.
 */
const audio = {
  content: fs.readFileSync(filename).toString('base64'),
};

const request = {
  config: config,
  audio: audio,
};

// Detects speech in the audio file. This creates a recognition job that you
// can wait for now, or get its result later.
const [operation] = await client.longRunningRecognize(request);

// Get a Promise representation of the final result of the job
const [response] = await operation.promise();
//console.log(response.results)
const transcription = response.results
  .map(result => result.alternatives[0].transcript)
  .join('\n');
if(transcription.length > 0){
    words = transcription.substr(0, transcription.length /2)
//console.log(words)
message.channel.send(words);
//voicecommands(message,user, voiceConnection, words)
}
}





client.login(process.env.DISCORD_TOKEN1);