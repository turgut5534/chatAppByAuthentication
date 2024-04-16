const express = require('express');
const path = require('path');
const mainRouter = require('./routers/mainRouter');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const publicDirectoy = path.join(__dirname, '../public');
const viewsDir = path.join(__dirname, '../views');

app.set('view engine', 'ejs');
app.set('views', viewsDir);
app.use(express.static(publicDirectoy));
app.use('/socket.io', express.static(path.join(__dirname, '../node_modules/socket.io/client-dist')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(mainRouter);

const server = http.createServer(app);
const io = socketio(server);
app.set('io', io);

const onlineUsers = []

io.on('connection', (socket) => {

    if (socket.user) {
        const username = `${socket.user.firstName} ${socket.user.lastName}`;
        socket.broadcast.emit('notify', { user: username, userId: socket.user.id, message: " has joined the chat", status: true })
    }

    socket.on('message', (data) => {

        const username = `${socket.user.firstName} ${socket.user.lastName}`;
        io.emit('sendToClient', { user: username, userId: socket.user.id, message: data.message })

    })

    socket.on('userLoggedIn', () => {

        const isUserOnline = onlineUsers.some(user => user.id === socket.user.id);

        // If the user is not already in the onlineUsers list, add them
        if (!isUserOnline) {
            onlineUsers.push(socket.user);
        }
        // console.log(onlineUsers)
        io.emit('showOnline', {users:onlineUsers})

    })

    socket.on('disconnect', () => {

        if (socket.user) {
            const username = `${socket.user.firstName} ${socket.user.lastName}`;
            io.emit('notify', { user: username, userId: socket.user.id, message: " has left the chat", status: false })

            const index = onlineUsers.findIndex(user => user.id === socket.user.id);

            if (index !== -1) {
                onlineUsers.splice(index, 1);
            }

            // console.log(onlineUsers)
            io.emit('userLoggedOut', {userId: socket.user.id})
        }

    })

});

server.listen(8000, () => {
    console.log('Server is up on 8000');
});
