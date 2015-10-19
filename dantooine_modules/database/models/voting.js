/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var votingSchema = new Schema ({
    _session: {type: Schema.Types.ObjectId, ref:'Session'},
    type: Number,
    allowed_to_vote: Number,
    question: String,
    variants: [{
        id: Number,
        content: String
    }],
    answers: [{
        MAC: String,
        answers: [{id: Number, value:Number}],
        timestamp: {type: Date, default: Date.now}
    }],
    extra_voters: [{
        role: String,
        name: String,
        surname: String,
        title: String
    }],
    quorum: Boolean,
    absolute_majority: Boolean
});

module.exports = mongoose.model('Voting', votingSchema);