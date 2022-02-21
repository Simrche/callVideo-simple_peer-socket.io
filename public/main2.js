var peers = {}
var socket = null
var localStream = null
const localVideo = document.getElementById('localVideo')

const configuration = {
    "iceServers": [{
            "urls": "stun:stun.l.google.com:19302"
        },
        // public turn server from https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
        // set your own servers here
        {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        }
    ]
}

// Enable the camera
navigator.mediaDevices.getUserMedia({audio : true, video: true}).then(stream => {

    localVideo.srcObject = stream;
    localStream = stream;
    localVideo.play()

    init()

}).catch(e => alert(`getusermedia error ${e.name}`))

function init() {
    socket = io()

    // Envoie et afficher les messages du chat ----------------------------------------------------------------------------------------------
    socket.on('chat_message', function(msg) {
        if(msg[0] != "") {
            let li = document.createElement('li')
            li.innerHTML = "Guest_" + fourLetter(msg[1]) + " : " + msg[0]
            document.getElementById('chat').appendChild(li)
        }
    })

    // Logs Connection et Deconnection ---------------------------------------------------------------------------------------------------
    socket.on('connection', function(id) {
        console.log("Guest_" + fourLetter(id) + " join")
        let li = document.createElement('li')
        li.innerHTML = "<span class='ita'>Guest_" + fourLetter(id) + " join</span>"
        document.getElementById('chat').appendChild(li)

        // Asking all other clients to setup the peer connection receiver
        for(let id in peers) {
            if(id === socket.id) continue
            console.log('sending init receive to ' + socket.id)
            peers[id].emit('initReceive', socket.id)
        }
    })

    socket.on('initReceive', socket_id => {
        console.log('INIT RECEIVE ' + socket_id)
        addPeer(socket_id, false)
        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id)
        addPeer(socket_id, true)
    })

    socket.on('aurevoir', function(id) {
        console.log("Guest_" + fourLetter(id) + " left")
        let li = document.createElement('li')
        li.innerHTML = "<span class='ita'>Guest_" + fourLetter(id) + " left</span>"
        document.getElementById('chat').appendChild(li)
    })

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
    })

    // Afficher et desafficher les personnes online ---------------------------------------------------------------------------------------
    socket.on('online', function(online) {
        document.getElementById('online').innerHTML = ""
        online.forEach(e => {
            var li = document.createElement('li')
            li.innerHTML = "<div class='ano'>👨</div> Guest_"+fourLetter(e)
            document.getElementById('online').appendChild(li)
        });
    })

    socket.on('offline', function(offline) {
        document.getElementById('online').innerHTML = ""
        offline.forEach(e => {
            var li = document.createElement('li')
            li.innerHTML = "<div class='ano'></div> Guest_"+fourLetter(e)
            document.getElementById('online').appendChild(li)
        });
    })
}

function addPeer(socket_id, am_initiator) {
    
    console.log('Addpeer')

    peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
        config: configuration
    })

    peers[socket_id].on('signal', data => {
        console.log('signal')
        socket.emit('signal', {
            signal: data,
            socket_id: socket_id
        })
    })

    peers[socket_id].on('stream', stream => {
        console.log('stream')
        let newVid = document.createElement('video')
        newVid.srcObject = stream
        newVid.id = socket_id
        newVid.autoplay = true
        newVid.classList = "video"
        document.getElementById("containerVideo").appendChild(newVid)
    })

    console.log(peers[socket_id])
}

function removePeer(socket_id) {

let videoEl = document.getElementById(socket_id)
if (videoEl) {

    const tracks = videoEl.srcObject.getTracks();

    tracks.forEach(function (track) {
        track.stop()
    })

    videoEl.srcObject = null
    videoEl.parentNode.removeChild(videoEl)
}
if (peers[socket_id]) peers[socket_id].destroy()
    delete peers[socket_id]
}

function send() {
    let text = document.getElementById('message').value
    socket.emit('chat_message', text)
    document.getElementById('message').value = ''
}

// Reduire les id ----------------------------------------------------------------------------------------------------------------------------
function fourLetter(id) {
    let answer = id.split('')[0]+id.split('')[1]+id.split('')[2]+id.split('')[3]
    return answer
}