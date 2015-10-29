/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var math = require('math');

var Voter = require('./voter');
var Schema = mongoose.Schema;

var votingSchema = new Schema({
    _session: {type: Schema.Types.ObjectId, ref: 'Session'},
    type: Number,
    allowed_to_vote: Number,
    question: String,
    state: Number,
    variants: [{
        id: Number,
        content: String
    }],
    answers: [{
        MAC: String,
        variantId: Number,
        value: Number,
        timestamp: {type: Date, default: Date.now}
    }],
    extra_voters: [{
        role: String,
        name: String,
        surname: String,
        title: String,
        present: Boolean
    }],
    quorum: Boolean,
    hasQuorum: {type: Boolean, default: false},
    absolute_majority: Boolean
});


votingSchema.methods.checkQuorum = function (presenceSummary, callback) {
    var self = this;
    var presentVotersCount = 0;
    for (var it = 0; it <= self.allowed_to_vote; it++) {
        presentVotersCount += presenceSummary[it];
    }
    for (var i = 0; i < self.extra_voters.length; i++) {
        if (self.extra_voters[i].present)
            presentVotersCount++;
    }
    Voter.find({group: {$lte: self.allowed_to_vote}}).exec(function (err, voters) {
        if (err) return callback(err);
        self.hasQuorum = math.floor((voters.length + self.extra_voters.length) / 2) + 1 <= presentVotersCount;
        self.save(function (err) {
            if (err) return callback(err);
            return callback(null);
        });
    });
};

votingSchema.methods.vote = function (MAC, answerID, answerValue, callback) {
    var self = this;
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
};


module.exports = mongoose.model('Voting', votingSchema);
