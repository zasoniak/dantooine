/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var votingSchema = new Schema ({
    _session: {type: Schema.Types.ObjectId, ref:'Session'},
    authorization: String,
    type: String,
    title: String,
    contents: String,
    variants: [ {id: Number, contents: String}],
    answers: [{MAC: String, answers: [Number], timestamp: {type: Date, default: Date.now}}],
    extra_voters: [{type: Schema.Types.ObjectId, ref:'Voter'}]
});

module.exports = mongoose.model('Voting', votingSchema);