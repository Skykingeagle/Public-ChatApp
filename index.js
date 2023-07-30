const { error } = require('console');
const { Socket } = require('dgram');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.static('public'));
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const mongodb_uri = process.env.mongodb_uri || "mongodb://127.0.0.1/chatApp"

mongoose.connect(mongodb_uri, {useNewUrlParser:true, useUnifiedTopology:true})
.then(()=> console.log("Mongodb connected"))
.catch((err)=>console.log(err));

const textSchema = new mongoose.Schema({
    author: String,
    content: String,
    image: String
});

const Message = mongoose.model('Message', textSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

io.on('connection', (socket) => {
    console.log("A new client is connected");

    Message.find({}).then((messages) => {
        socket.emit("load messages", messages);
    })

    socket.on('username', (username) => {
        console.log("The username is : " + username)
        socket.username = username;
        io.emit("user joined", username);
    });

    socket.on('chat message', (msg) => {
        const message = new Message({
            author:msg.author,
            content:msg.content,
            image:msg.image
        })
        message.save().then(() => {
            io.emit("chat message", message);
        }).catch((err) => {
            console.log(err); 
        })
    })

    socket.on('disconnect', () => {
        io.emit("user left", socket.username)
    })

    
});



http.listen(5000, () => {
    console.log("Listening on 5000...");
});
