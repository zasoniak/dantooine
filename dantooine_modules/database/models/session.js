/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var sessionSchema = new Schema({
    _council:{type:Schema.Types.ObjectId, ref: 'Council'},
    name: String,
    description: String,
    type: String,
    presence:[{type:Schema.Types.ObjectId, ref: 'Voter'}],
    date: Date,
    votings: [{type: Schema.Types.ObjectId, ref: 'Voting'}]
});


module.exports = mongoose.model('Session', sessionSchema);