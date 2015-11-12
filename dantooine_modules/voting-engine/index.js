/**
 * @name Voting Engine
 * <p>
 *     Facade for handling voting session
 *     Wraps up database models and manages bluetooth's part of voting session
 * @version 1.0
 * @author Mateusz Zaso�ski
 */

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

/**
 * SessionFacade constructor
 * <p>
 *     Setups initial configuration and data
 * @param bluetoothController - apply preconfigured bluetooth controller to facade object
 * @constructor
 */
function SessionFacade(bluetoothController) {
    this.bluetoothController = bluetoothController;
    this.session = null;
    this.currentQuestion = {};
    this.currentQuestion.id = null;
    this.currentQuestion.subquestionNo = null;
    this.currentQuestion.summary = null;
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
    self.bluetoothController.startSession(self);
    self.session.state = STATES.STARTED;
    self.session.save(function (err) {
        if (err) return callback(err);
        return callback(null);
    });
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
            self.bluetoothController.turnOnDevice(voter.group);
        }
        else {
            self.session.presence.pop(voter);
            self.bluetoothController.turnOffLastDevice();
        }
        self.session.save(function (err) {
            if (err) return callback(err);
            async.each(self.session.votings, function (voting, callback2) {
                voting.setPresence(function (err) {
                    if (err) return callback2(err);
                });
            }, callback);
        });
    });
};


SessionFacade.prototype.setPresenceForExtraVoter(votingID, extraVoterID, value, callback)
{
    if (value) {
        var self = this;
        VotingDataModel.findById(votingID).exec(function (err, voting) {
            if (err) return callback(err);
            for (var i = 0; i < voting.extra_voters.length; i++) {
                if (voting.extra_voters[i].id == extraVoterID) {
                    sefl.bluetoothController.turnOnDeviceForExtraVoter(function (err, device) {
                        if (err) return callback(err);
                        voting.extra_voters[i].present = true;
                        voting.extra_voters[i].device = device.id;
                        voting.save(callback);
                    })
                }
            }
        });
    }
}
;


/**
 * End current session
 * @param callback - error handler like function(err)
 */
SessionFacade.prototype.endSession = function (callback) {
    var self = this;
    if (self.session.state == STATES.STARTED) {
        self.session.state = STATES.FINISHED;
        self.session.save(function (err) {
            if (err) return callback(err);
            self.bluetoothController.endSession(callback);
        });
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
SessionFacade.prototype.nextVoting = function (votingID, callback) {
    var self = this;
    self.currentQuestion.id = votingID;
    self.currentQuestion.subquestionNo = 0;
    self.currentQuestion.summary = null;
    VotingDataModel.findById(votingID).exec(function (err, voting) {
        if (err) callback(err);
        self.bluetoothController.nextVoting(voting, callback);
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
        if (voting.state == STATES.CREATED) {
            voting.state = STATES.STARTED;
            voting.save(function (err) {
                if (err) return callback(err);
                self.currentQuestion.state = STATES.STARTED;
                self.updateSession(function (err) {
                    if (err) return callback(err);
                    self.bluetoothController.startVoting(callback);
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
            self.bluetoothController.stopVoting(callback);
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
            voting.vote(vote.MAC, self.currentQuestion.subquestionNo, vote.value, function (err) {
                if (err) return callback(err);
                self.updateSession(callback);
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
            self.bluetoothController.nextSubquestion(callback);
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
                self.bluetoothController.stopVoting(callback);
            });
        });
    });
};

module.exports = SessionFacade;