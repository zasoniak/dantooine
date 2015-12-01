/**
 * Created by mateusz on 01/12/15.
 */


var io = require('socket.io')(80);


function WebSocket() {
    io.on('connection', function (socket) {

    });
}

WebSocket.prototype.prepareVoting = function (voting) {
    io.emit('prepareVoting', {voting: voting});
};

WebSocket.prototype.startVoting = function () {
    io.emit('startVoting');
};

WebSocket.prototype.nextSubquestion = function () {
    io.emit('nextSubquestion');
};

WebSocket.prototype.endVoting = function () {
    io.emit('endVoting');
};

WebSocket.prototype.showResult = function (results) {
    io.emit('showResult', {results: results});
};

WebSocket.prototype.updateVotes = function (voted, all) {
    io.emit('updateVotes', {voted: voted, all: all});
};

module.export = WebSocket;