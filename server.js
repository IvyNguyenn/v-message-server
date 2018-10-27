var express = require("express");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(3001);

var listUser = [];
var listMessage = [];

io.on("connection", function(socket) {
    console.log("Co nguoi ket noi: " + socket.id);
    socket.on("disconnect", function() {
        let index = listUser.findIndex(i => i.email === socket.email);
        listUser.splice(index, 1);
        console.log("Co nguoi ngat ket noi: ", socket.id);
    });
    // Login, Logout
    socket.on("CLIENT-LOGIN", function(data) {
        let index = listUser.findIndex(i => i.email === data.email);
        if (index >= 0) {
            socket.emit("SERVER-LOGIN-FAILURE");
        } else {
            listUser.push(data);
            socket.email = data.email;
            socket.username = data.username;
            socket.emit("SERVER-LOGIN-SUCCESS", data);
            io.sockets.emit("SERVER-SEND-LIST-USER", listUser);
            io.sockets.emit("SERVER-SEND-MESSAGE", listMessage);
        }
    });

    socket.on("CLIENT-LOGOUT", function() {
        console.log(socket.id + " - Logout");
        let index = listUser.findIndex(i => i.email === socket.email);
        listUser.splice(index, 1);
        socket.broadcast.emit("SERVER-SEND-LIST-USER", listUser);
    });
    //CLIENT SEND MESSAGE
    socket.on("CLIENT-SEND-MESSAGE", function(message) {
        listMessage.push({
            message: message,
            email: socket.email,
            username: socket.username
        });
        //io.sockets.emit("SERVER-SEND-MESSAGE", listMessage);
        io.sockets
            .in(socket.room)
            .emit("SERVER-SEND-MESSAGE-GROUP", listMessage);
    });
    socket.on("CLIENT-SEND-GROUP-NAME", function(groupName) {
        socket.join(groupName);
        socket.room = groupName;
        var listRoom = [];
        for (room in socket.adapter.rooms) {
            listRoom.push(room);
        }
        io.sockets.emit("SERVER-SEND-LIST-GROUP", listRoom);
        socket.emit("SERVER-SEND-CURR-GROUP", groupName);
    });
    socket.on("CLIENT-SELECT-GROUP-NAME", function(groupName) {
        socket.leave(socket.room);
        socket.join(groupName);
        socket.room = groupName;
        socket.emit("SERVER-SEND-CURR-GROUP", groupName);
    });
});

app.get("/", function(req, res) {
    res.render("index");
});
