/**
 * Created by mateusz on 01/12/15.
 */


var io = require('socket.io')(8080);

function WebSocket() {
    io.on('connection', function (socket) {
        console.log('Połączono z klientem :)');
        socket.on('disconnect', function () {
            console.log('Klient się rozłączył :C');
        });
    });
}

WebSocket.prototype.prepareVoting = function (voting) {
    io.emit('voting prepared', {voting: voting});
};

WebSocket.prototype.startVoting = function () {
    io.emit('voting started');
};

WebSocket.prototype.nextSubquestion = function () {
    io.emit('nextSubquestion');
};

WebSocket.prototype.endVoting = function (result) {
    //console.log(result);
    io.emit('voting ended', {results: result});
};


WebSocket.prototype.updateVotes = function (voted, all) {
    io.emit('votes updated', {voted: voted, all: all});
};

module.exports = WebSocket;