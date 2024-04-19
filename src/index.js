const express = require('express');
const path = require('path');
const mainRouter = require('./routers/mainRouter');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketio = require('socket.io');
const validator = require('validator')

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

const Message = require('./models/Message')

const server = http.createServer(app);
const io = socketio(server);
app.set('io', io);

const onlineUsers = []

io.on('connection', (socket) => {

    socket.on('message', async (data) => {

        try {
    
            const username = `${socket.user.firstName} ${socket.user.lastName}`;

            if (data.message.trim() !== '') { // Check if message is not empty after trimming whitespace
                io.to(data.roomId).emit('sendToClient', { user: username, userId: socket.user.id, message: data.message });
    
                await Message.create({
                    text: data.message,
                    UserId: socket.user.id,
                    RoomId: data.roomId
                });
            }

        } catch(e) {
            console.log(e)
        }

    })

    socket.on('userLoggedIn', (room) => {

        const isUserOnline = onlineUsers.some(user => user.id === socket.user.id);

        if (!isUserOnline) {
            newUser = {
                id: socket.user.id,
                firstName: socket.user.firstName,
                lastName: socket.user.lastName,
                email: socket.user.email,
                room: room.room
            }
            onlineUsers.push(newUser);

        }

        const onlineUsersInRoom = onlineUsers.filter(user => user.room  === room.room)

        socket.join(room.room)
        io.to(room.room).emit('showOnline', {users:onlineUsersInRoom})

        const username = `${socket.user.firstName} ${socket.user.lastName}`;
        socket.broadcast.to(room.room).emit('notify', { user: username, userId: socket.user.id, message: " has joined the chat", status: true })

    })

    socket.on('disconnect', () => {

    
        try {
            if (socket.user) {
            
                const user = onlineUsers.find(user => user.id === socket.user.id)
    
                const username = `${socket.user.firstName} ${socket.user.lastName}`;
        
                io.to(user.room).emit('notify', { user: username, userId: socket.user.id, message: " has left the chat", status: false })
    
                const index = onlineUsers.findIndex(user => user.id === socket.user.id);
    
                if (index !== -1) {
                    onlineUsers.splice(index, 1);
                }
    
                io.to(user.room).emit('userLoggedOut', {userId: socket.user.id, onlineUsers: onlineUsers})
            }
        } catch(e) {
            console.log(e)
        }


    })

});

server.listen(8000, () => {
    console.log('Server is up on 8000');
});
