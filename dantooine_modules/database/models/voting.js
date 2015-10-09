/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var votingSchema = new Schema ({
    _session: {type: Schema.Types.ObjectId, ref:'Session'},
    authorization_level: Number,
    type: Number,
    question: String,
    variants: [ {id: Number, content: String}],
    answers: [{MAC: String, answers: [Number], timestamp: {type: Date, default: Date.now}}],
    extra_voters: [{type: Schema.Types.ObjectId, ref:'Voter'}]
});

module.exports = mongoose.model('Voting', votingSchema);