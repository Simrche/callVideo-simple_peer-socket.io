var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var path = require('path')
var port = 8080

peers = {}
online = []
onlineCam = []

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html")
})

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))

io.on('connection', function(socket) {

    io.emit('connection', socket.id)
    peers[socket.id] = socket
    online.push(socket.id)
    io.emit("online", online)

    for(let id in peers) {
        if(id === socket.id) continue
        peers[id].emit('initReceive', socket.id)
    }

    socket.on('chat_message', function(msg) {
        let i = [msg, socket.id]
        io.emit('chat_message', i)
    })

    socket.on('disconnect', () => {
        let i = 0
        online.forEach(e => {
            if(e === socket.id) {
                online.splice(i, 1)
                i--
            }
            i++
        });
        socket.broadcast.emit('aurevoir', socket.id)
        socket.broadcast.emit('offline', online)
    })

    socket.on('signal', data => {
        if(!peers[data.socket_id])return
        peers[data.socket_id].emit('signal', {
            socket_id: socket.id,
            signal: data.signal
        })
    })

    socket.on('initSend', init_socket_id => {
        peers[init_socket_id].emit('initSend', socket.id)
    })
})

http.listen(port, function() {
    console.log("server running on "+ port)
})

