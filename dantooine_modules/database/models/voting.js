/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var math = require('math');

var Voter = require('./voter');
var Schema = mongoose.Schema;

var votingSchema = new Schema({
    _session: {type: Schema.Types.ObjectId, ref: 'Session'},
    type: Number, // 1 - yes/no, 2 - multiple
    allowed_to_vote: Number,    // highest group number
    allowed_to_vote_summary: [Number],   // how many voters there are in every group
    presence_summary: [Number],  // how many voters of each group are present
    question: String,
    state: {type: Number, default: 0},
    variants: [{
        id: Number,
        content: String
    }],
    max_answers_number: Number,
    answers: [{
        MAC: String,
        variantId: Number,
        value: Number,
        timestamp: {type: Date, default: Date.now}
    }],
    extra_voters: [{
        id: Number,
        role: String,
        name: String,
        surname: String,
        title: String,
        present: Boolean,    // added to check special guests presence
        device: {type: Schema.Types.ObjectId, ref: 'Device'}
    }],
    quorum: Boolean,
    hasQuorum: {type: Boolean, default: false},
    absolute_majority: Boolean
});


votingSchema.methods.setAllowedToVote = function (callback) {
    var self = this;
    Voter.find({group: {$lte: self.allowed_to_vote}}).exec(function (err, voters) {
        if (err) return callback(err);
        var array = [];
        for (var i = 0; i < self.allowed_to_vote+1; i++) {
            array[i] = 0;
        }
        self.allowed_to_vote_summary = array;
        for (var it = 0; it < voters.length; it++) {
            self.allowed_to_vote_summary[voters[it].group]++;
        }
        return callback(null);
    });
};

votingSchema.methods.setPresence = function (session, callback) {
    var self = this;
    if (self.state == 0) {
        var array = [];
        for (var i = 0; i < self.allowed_to_vote+1; i++) {
            array[i] = 0;
        }
        self.presence_summary = array;
        for (var it = 0; it <= session.length; it++) {
            if (session.presence[it].group <= self.allowed_to_vote)
                self.presence_summary[session.presence[it].group]++;
        }
        self.save(function (err) {
            if (err) return callback(err);
            return callback(null);
        });
    }
    else return callback(null);
};


votingSchema.methods.checkQuorum = function (callback) {
    var self = this;
    if (self.state == 0) {
        var presentVotersCount = 0;
        for (var it = 0; it <= self.allowed_to_vote; it++) {
            presentVotersCount += self.presence_summary[it];
        }
        for (var i = 0; i < self.extra_voters.length; i++) {
            if (self.extra_voters[i].present)
                presentVotersCount++;
        }
        var allowedCount = 0;
        for (var it2 = 0; it2 <= self.allowed_to_vote; it2++) {
            allowedCount += self.allowed_to_vote_summary[it2];
        }
        allowedCount += self.extra_voters.length;


        self.hasQuorum = math.floor((allowedCount) / 2) + 1 <= presentVotersCount;
        self.save(function (err) {
            if (err) return callback(err);
            return callback(null);
        });
    }
    else return callback(null);
};

votingSchema.methods.vote = function (MAC, answerID, answerValue, callback) {
    var self = this;
    if (self.state == 1) {
        var answered = false;
        for (var ansIt = 0; ansIt < self.answers.length; ansIt++) {
            if (self.answers[ansIt].MAC == MAC && self.answers[ansIt].variantId == answerID) //has already answered
                answered = true;
        }
        if (!answered) {
            var temp = {
                MAC: MAC,
                variantId: answerID,
                value: answerValue
            };
            self.answers.push(temp);
            self.save(function (err) {
                return callback(err);
            });
        }
        return callback(null);
    }
    else return callback(null);
};


module.exports = mongoose.model('Voting', votingSchema);
