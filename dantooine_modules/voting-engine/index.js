/**
 * @name Voting Engine
 * <p>
 *     Facade for handling voting session
 *     Wraps up database models and manages bluetooth's part of voting session
 * @version 1.0
 * @author Mateusz Zasonski
 */

var Bluetooth = require('../bluetooth');
var WebSocket = require('./websocket');

/**
 * Required import for database usage
 * @type {*|Session}
 */
var SessionDataModel = require('../database').Session;
/**
 * Required import for database usage
 * @type {*|Voting}
 */
var VotingDataModel = require('../database').Voting;
/**
 * Required import for database usage
 * @type {*|Voter}
 */
var VoterDataModel = require('../database').Voter;

/**
 * For parallel data processing
 * @type {async|exports|module.exports}
 */
var async = require('async');

/**
 * Constant enum with possible session and voting states
 * @type {{CREATED: number, STARTED: number, FINISHED: number}}
 */
var STATES = {
    CREATED: 0,
    STARTED: 1,
    FINISHED: 2
};


var VOTER_GROUPS = {
    FULL: 0,
    LIMITED: 1,
    EXTRA: 2
};

/**
 * SessionFacade constructor
 * <p>
 *     Setups initial configuration and data
 * @param bluetoothController - apply preconfigured bluetooth controller to facade object
 * @constructor
 */
function SessionFacade(bluetoothController) {
    var self = this;
    this.bluetoothController = new Bluetooth();
    //this.bluetoothController = new Bluetooth(function (id, result) {
    //    self.vote(id, result);
    //});
    this.session = null;
    this.currentQuestion = {};
    this.currentQuestion.id = null;
    this.currentQuestion.subquestionNo = null;
    this.currentQuestion.summary = null;
    this.webSocket = new WebSocket();
    this.cockpitSocket = require('socket.io')(8081);
    this.cockpitSocket.on('connect', function (socket) {
        console.log('Połączono z kokpitem');
        socket.on('set presence', function (data) {
            console.warn('Wlazło!!');
            self.setPresence(data.voterID, data.isPresent, function (error) {
                if (error) socket.emit('session error', {message: error});
            })
        });
        //TODO: set presence for extra voters
        socket.on('prepare voting', function (data) {
            console.log('Prepare voting event received.');
            //================================================================================================
            //ACHTUNG! to jest prowizorka ktorej nie powinno tu byc :P powinno dzialac przez set presence
            //================================================================================================
            //self.bluetoothController.wakeUpAndSetAuthorization(1, function (err) {
            //    if (err) console.log('zjebalo sie');
            //    console.log('podlaczylo sie cos');
            //});
            //KONIEC ACHTUNGA!
            self.prepareVoting(data.votingID, function (error) {
                if (error) socket.emit('session error', {message: error});
            });
        });
        socket.on('start voting', function () {
            console.log('Start voting event received.');
            self.startVoting(function (error) {
                if (error) socket.emit('session error', {message: error});
            });
        });
        socket.on('end voting', function () {
            self.endVoting(function (error) {
                if (error) socket.emit('session error', {message: error});
            })
        });
        socket.on('next question', function () {
            self.nextSubquestion(function (error) {
                if (error) socket.emit('session error', {message: error});
            });
        });
        socket.on('voted', function (data) {
            console.log('There is a vote here!');
            self.vote(data, function (error) {
                if (error) socket.emit('session error', {message: error});
            })
        });
    })
}

/**
 * Load session data
 * @param sessionID - objectID of session
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.loadSession = function (sessionID, callback) {
    var self = this;
    SessionDataModel.findById(sessionID).populate('votings devices presence').exec(function (err, sessionData) {
        if (err) return callback(err);
        self.session = sessionData;
        return callback(null);
    });
};

/**
 * Update session with latest data
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.updateSession = function (callback) {
    var self = this;
    SessionDataModel.findById(self.session.id).populate('votings presence devices').exec(function (err, sessionData) {
        if (err) return callback(err);
        self.session = sessionData;
        return callback(null);
    });
};

/**
 * Starts session
 * <p>
 *     Setups session to start voting. Prepares bluetooth for votings.
 *     Changes session state to STARTED
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.startSession = function (callback) {
    var self = this;
    self.session.state = STATES.STARTED;
    self.session.save(callback);
};

/**
 * Sets presence of specific voter
 * <p>
 *     Sets presence and validate question quorum requirements
 * @param voterID - id of a voter
 * @param value - boolean value if is present or not
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.setPresence = function (voterID, value, callback) {
    var self = this;
    VoterDataModel.findById(voterID).exec(function (err, voter) {
        if (err) return callback(err);
        if (value) {
            self.session.presence.push(voter);
            console.log(self.session.presence.length);
            var presenceSummary = [0,0,0,0,0,0,0,0,0,0,0];
            for (var it = 0; it < self.session.presence.length; it++) {
                presenceSummary[self.session.presence[it].group]++;
            }
            self.bluetoothController.wakeUpAndSetAuthorization(voter.group, function (err, peripheralID) {
                if (err) return callback(err);
                self.session.save(function (err) {
                    if (err) return callback(err);
                    async.each(self.session.votings, function (voting, callback2) {
                        voting.setPresence(presenceSummary,function (err) {
                            if (err) return callback2(err);
                        });
                    }, callback);
                });
            });
        }
        else {
            self.session.presence.pop(voter);
            self.bluetoothController.turnOffLastDevice();
            self.session.save(function (err) {
                if (err) return callback(err);
                async.each(self.session.votings, function (voting, callback2) {
                    voting.setPresence(function (err) {
                        if (err) return callback2(err);
                    });
                }, callback);
            });
        }
    });
};


SessionFacade.prototype.setPresenceForExtraVoter = function (votingID, extraVoterID, value, callback) {
    if (value) {
        var self = this;
        VotingDataModel.findById(votingID).exec(function (err, voting) {
            if (err) return callback(err);
            for (var i = 0; i < voting.extra_voters.length; i++) {
                (function (i) {
                    if (voting.extra_voters[i].id == extraVoterID) {
                        self.bluetoothController.wakeUpAndSetAuthorization(VOTER_GROUPS.EXTRA, function (err, device) {
                            if (err) return callback(err);
                            voting.extra_voters[i].present = true;
                            voting.extra_voters[i].device = device.id;
                            voting.save(callback);
                        })
                    }
                }(i))
            }
        });
    }
};


/**
 * End current session
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.endSession = function (callback) {
    var self = this;
    if (self.session.state == STATES.STARTED) {
        self.session.state = STATES.FINISHED;
        self.session.save(callback);
    }
};

/**
 * Checks quorum requirement for every voting
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.checkQuorum = function (callback) {
    var self = this;
    async.each(self.session.votings, function (voting, callback2) {
        voting.checkQuorum(function (err) {
            if (err) return callback2(err);
        });
    }, callback);
};

/**
 * Prepares next Voting to begin.
 * @param votingID - id of next voting
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.prepareVoting = function (votingID, callback) {
    var self = this;
    console.log("co z tym id?: {}", votingID);
    self.currentQuestion.id = votingID;
    self.currentQuestion.subquestionNo = 0;
    self.currentQuestion.summary = null;
    VotingDataModel.findById(votingID).exec(function (err, voting) {
        if (err) callback(err);
        self.webSocket.prepareVoting(voting);
        return callback(null);
    });
};

/**
 * Starts current voting
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.startVoting = function (callback) {
    var self = this;
    VotingDataModel.findById(self.currentQuestion.id).exec(function (err, voting) {
        if (err) return callback(err);
        console.warn(voting);
        if (voting.state == STATES.CREATED) {
            voting.state = STATES.STARTED;
            voting.save(function (err) {
                if (err) return callback(err);
                self.currentQuestion.state = STATES.STARTED;
                self.updateSession(function (err) {
                    if (err) return callback(err);
                    var BLEQuestion = {
                        groupNo: voting.allowed_to_vote,
                        //possibleAnswers: voting.max_answers_number,
                        possibleAnswers: 1,
                        id: voting.id,
                        extraVoters: voting.extra_voters
                    };
                    self.bluetoothController.startVoting(BLEQuestion, function (err) {
                        if (err) return callback(err);
                        self.webSocket.startVoting();
                        return callback(null);
                    });
                });
            });
        }
    });
};

/**
 * Revert current voting
 * <p>
 *     Clears voting from answers and sets it's state to CREATED
 * @param votingID - id of voting to revert
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.revertVoting = function (votingID, callback) {
    var self = this;
    VotingDataModel.findById(self.currentQuestion.id).exec(function (err, voting) {
        if (err) return callback(err);
        voting.state = STATES.CREATED;
        voting.answers = [];
        voting.save(function (err) {
            if (err) return callback(err);
            self.bluetoothController.endVoting(function (err) {
                if (err) return callback(err);
                self.webSocket.endVoting(null);
                return callback(null);
            });
        });
    });
};


/**
 * Single vote - serves data input from user's device
 * <p>
 * Matches MAC address and answer value with the current question (and it's subquestion if required).
 * The voting is updated with user's answer and saved
 * @param vote - JSON like { MAC: String, value: Number } },
 * @param callback in format function(err) - provides data error handling
 */
SessionFacade.prototype.vote = function (vote, callback) {
    var self = this;
    VotingDataModel.findById(self.currentQuestion.id).exec(function (err, voting) {
        if (err) return callback(err);
        if (voting.state == STATES.STARTED) {
            voting.vote(vote.id, self.currentQuestion.subquestionNo, vote.vote, function (err) {
                if (err) return callback(err);
                self.updateSession(function (err) {
                    if (err) return callback(err);
                    var answersDone = 0;
                    for (var i = 0; i < voting.answers.length; i++) {
                        if (self.currentQuestion.subquestionNo == voting.answers[i].variantId)
                            answersDone++;
                    }
                    self.webSocket.updateVotes(answersDone, voting.allowed_to_vote.length);
                    self.cockpitSocket.emit('votes updated', {voted: answersDone, all: voting.allowed_to_vote.length});
                });
            });
        }
        return callback(null);
    });
};

/**
 * Proceed to next subquestion
 * <p>
 *     Prepares next subquestion if the voting is multi-question.
 *     If it is the last subquestion, ends voting.
 *     If voting has only one question, ends voting.
 * @param callback
 */
SessionFacade.prototype.nextSubquestion = function (callback) {
    var self = this;
    self.currentQuestion.subquestionNo++;
    VotingDataModel.findById(self.currentQuestion.id).exec(function (err, voting) {
        if (voting.variants.length > self.currentQuestion.subquestionNo)
            self.bluetoothController.startNextSubQuestion(function (err) {
                if (err) return callback(err);
                self.webSocket.nextSubquestion();
                return callback(null);
            });
        else
            self.endVoting(callback);
    });
};

/**
 * Ends current voting
 * <p>
 * End voting and sets its state to finished.
 * Saves summary of current voting in order to present voting results.
 * @param callback in format function(err) - provides data error handling
 */
SessionFacade.prototype.endVoting = function (callback) {
    var self = this;
    VotingDataModel.findById(self.currentQuestion.id).exec(function (err, voting) {
        if (err) return callback(err);
        voting.state = STATES.FINISHED;
        voting.save(function (err) {
            if (err) return callback(err);
            self.currentQuestion.id = null;
            self.currentQuestion.subquestionNo = 0;
            self.currentQuestion.summary = voting;
            self.updateSession(function (err) {
                if (err) return callback(err);
                self.bluetoothController.endVoting(function (err) {
                    if (err) return callback(err);
                    self.webSocket.endVoting(voting);
                    return callback(null);
                });
            });
        });
    });
};

module.exports = SessionFacade;