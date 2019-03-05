// server.js
// where your node app starts
// init project

// init project
const http = require('http')
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const server = http.Server(app);
const port = process.env.PORT || 5000;
const socketIO = require('socket.io');
const io = socketIO(server);
const youtube = require('./src/youtube.js')
let yt = new youtube('AIzaSyCuGHc2cSDYfkee9cn9iqY71nPaZ_NsSRc')
let queue = []
let currDl = false
let vidDl = false
let deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
          fs.readdirSync(path).forEach(function(file,index){
          var curPath = path + "/" + file;

          if(fs.lstatSync(curPath).isDirectory()) { // recurse
              deleteFolderRecursive(curPath);
          } else { // delete file
              fs.unlinkSync(curPath);
          }
      });
      fs.rmdirSync(path);
    }
};
setInterval(() => {
    if(queue[0] || currDl) return
    deleteFolderRecursive(__dirname + '/videos')
    if(fs.existsSync(__dirname + '/.git')) deleteFolderRecursive(__dirname + '/.git')
    if (!fs.existsSync(__dirname + '/videos')) fs.mkdirSync(__dirname + '/videos');
}, 10000)
let nextQueue = () => {
    queue.splice(0, 1)
    if(!queue[0]) return
    while(queue.find((element, i) => element.socket.disconnected == true)) queue.splice(queue.findIndex((element, i) => element.socket.disconnected == true), 1)
    if(!queue[0]) return
    queue.forEach((l, i) => {
        if(i){ 
            l.socket.emit('notifUpdate', {
                id:l.notif.id,
                title:l.notif.title,
                body:`You are currently number ${i + 1}/${queue.length}`,
                type:'queue'
            })
        }
        
    })
    let socket = queue[0].socket
    let notif = queue[0].notif
    notif.title = notif.title.replace(/Queing Video: /g, 'Getting your video: ')
    notif.body = 'Your download should progress shortly'
    notif.type = 'dwnld'
    socket.emit('notifUpdate', notif)
    socket.emit('downloading')
    let vid = queue[0].vid
    let url = `https://youtube.com/search?v=${vid.id}`
    currDl = true
    vidDl = false
    
    setTimeout(() => {
        if(socket.disconnected && queue[0].socket == socket){
            fs.unlink(__dirname + '/videos/' + vid.title.replace(/[\W_]+/g," ") + '.mp4', () => {
                currDl = false
                console.log('unlinked')
                nextQueue()
            })
        }
    }, 20000)
    yt.downloadVideo(url, __dirname, vid)
        .then(() => {
            vid.title  = vid.title.replace(/[\W_]+/g," ");
            socket.emit('done', vid.title + '.mp4')
            vidDl = true
      
        })
        .catch(err => {
            if(err == 'File too big') socket.emit('tooBig')

            nextQueue()
            vidDl = true
        })
}
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use('/videos', express.static('videos'))
// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/out/index.html');
});
server.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + server.address().port);
});
io.on('connection', socket => {
    socket.on('search', sent => {
        console.log(sent)
        yt.search(sent.query, 50, sent.sortBy)
            .then(vids => {
                let ret = vids.map((vid, i) => {
                    if(!vid){ console.log(vids.length, i);console.log(vids[i])}
                    if(vid.type == 'video'){
                        return {
                            title:vid.title, 
                            id: vid.id,
                            thumbnail:vid.thumbnails.high,
                            channel:vid.channel,
                            type:'video'
                        }
                    }else if(vid.type == 'channel'){
                        return {
                            title:vid.title,
                            thumbnail:vid.thumbnails.high,
                            type:'channel'
                        }
                    }else if(vid.type == 'playlist'){
                        return {
                            title:vid.title,
                            thumbnail:vid.thumbnails.high,
                            type:'playlist'
                        }
                    }
                })
                socket.emit('search', ret)
            })
    })
    socket.on('download', vid => {
        if(!queue.length){
            let url = `https://youtube.com/search?v=${vid.id}`
            queue.push({socket:socket, vid: vid})
            socket.emit('downloading')
            socket.emit('notif', {
                id:Math.random(),
                title:`Getting your video: ${vid.title} !`,
                body:'Your download should progress shortly',
                type:'dwnld'
            })
            vidDl = false
            setTimeout(() => {
                if(socket.disconnected && queue[0].socket == socket){
                    fs.unlink(__dirname + '/videos/' + vid.title.replace(/[\W_]+/g," ") + '.mp4', () => {
                        currDl = false
                        console.log('unlinked')
                        nextQueue()
                    })
                }
            }, 20000)
            yt.downloadVideo(url, __dirname, vid)
               .then(() => {
                    vid.title  = vid.title.replace(/[\W_]+/g," ");
                    socket.emit('done', vid.title + '.mp4')
                    console.log(__dirname + '/videos/' + vid.title)
                    currDl = true
                    vidDl = true
                    
                })
                .catch(err => {
                    if(err == 'File too big') socket.emit('tooBig')
                    
                    nextQueue()
                    vidDl = true
                })
        }
        else {
            socket.emit('queuing', {n: `${queue.length}/${queue.length}`})
            console.log('dab')
            let notif = {
                id:Math.random(),
                title:`Queing Video: ${vid.title} !`,
                body:`You are currently number ${queue.length}/${queue.length}`,
                type:'queue'
            }
            socket.emit('notif', notif)
            queue.push({
                socket:socket, 
                vid: vid,
                notif:notif
            })
            queue.forEach((l, i) => {
                if(i){ 
                    console.log({
                        id:l.notif.id,
                        title:l.notif.title,
                        body:`You are currently number ${i + 1}/${queue.length}`,
                        type:'queue'
                    })
                    l.socket.emit('notifUpdate', {
                        id:l.notif.id,
                        title:l.notif.title,
                        body:`You are currently number ${i + 1}/${queue.length}`,
                        type:'queue'
                    })
                }

            })
        }
    })
    socket.on('del', fileName => {
        fs.unlink(__dirname + '/videos/' + fileName, () => {
            currDl = false
            console.log('unlinked')
            nextQueue()
        })
        
    })
    socket.on('log', console.log)
    
})