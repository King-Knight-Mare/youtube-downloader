class Timeout {
    constructor(){
        this.timeout = setTimeout(...arguments)
        this.start = new Date()
        this.time = arguments[1]
    }
    get timeLeft(){
        return new Date().getTime() - this.start.getTime()
    }
    get percntDone(){
        return (new Date().getTime() - this.start.getTime())/this.time < 1.2 ? (new Date().getTime() - this.start.getTime())/this.time : 1
    }
}
var socket = io()
console.log = arg => {socket.emit('log', arg)}
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
if(getCookie('mostRecentSearch')){ 
    let toSend = {
        query: getCookie('mostRecentSearch'),
        sortBy: 'relevance'
    }
    socket.emit('search', toSend)
    document.getElementById('search').value = getCookie('mostRecentSearch')
}
socket.on('search', vids => {
    let res = document.getElementById('results')
    res.innerHTML = ''
    if(!vids.length) return res.innerHTML = '<h2><b>No Results</b></h2>'
    console.log(vids.length)
    vids.forEach(vid => {
        if(vid.type == 'video'){
            let vidContainer = document.createElement('div')
            let v = document.createElement('div')
            v.classList.add('vid')
            let vb = document.createElement('button')
            vb.classList.add('downloadButton')
            v.id = vid.id
            vb.addEventListener('click', e => {
                e.preventDefault()
                socket.emit('download', vid)
            })
            let title = document.createElement('h2')
            title.innerHTML = vid.title
            title.classList.add('title')
            let channel = document.createElement('h4')
            channel.innerHTML = vid.channel
            let thumbnail = document.createElement('img')
            thumbnail.src = vid.thumbnail.url
            thumbnail.classList.add('thumbnail')

            channel.classList.add('cname')
            vb.appendChild(thumbnail)

            v.appendChild(vb)
            v.appendChild(title)
            v.appendChild(channel)
            res.appendChild(v)
        }else if(vid.type == 'channel'){
            let c = document.createElement('div')
            c.classList.add('channel')
            let title = document.createElement('h3')
            let thumbnail = document.createElement('img')
            thumbnail.src = vid.thumbnail.url
            thumbnail.classList.add('cthumbnail')
            title.innerHTML = vid.title
            c.appendChild(thumbnail)
            c.appendChild(title)
            res.appendChild(c)
        }
    })
})
socket.on('done', fileName => {
    download(fileName, window.location + 'videos/' + fileName)
    setTimeout(() => socket.emit('del', fileName), 10000)
    document.getElementById('downloading').style.display = 'none'
})
socket.on('err', document.write)
socket.on('queuing', l => {
    document.getElementById('queuing').style.display = 'block'
    document.getElementById('qnum').innerHTML = l.n
    document.getElementById('tooBig').style.display = 'none'
})
socket.on('downloading', () => {
    document.getElementById('downloading').style.display = 'block'
    document.getElementById('queuing').style.display = 'none'
    document.getElementById('tooBig').style.display = 'none'
    alert('downloading')
})
socket.on('tooBig', () => {
    document.getElementById('tooBig').style.display = 'block'
    document.getElementById('queuing').style.display = 'none'
    document.getElementById('downloading').style.display = 'none'
    setTimeout(() => {
        document.getElementById('tooBig').style.display = 'none'
    }, 3000)
    
})
document.getElementById('searchForm').addEventListener('submit', e => {
    e.preventDefault()
    let toSend = {
        query: document.getElementById('search').value,
        sortBy: document.getElementById('sortBy').value
    }
    socket.emit('search', toSend)
    setCookie('mostRecentSearch', document.getElementById('search').value)
})
function download(filename, url) {
    var element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
