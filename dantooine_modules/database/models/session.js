/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var sessionSchema = new Schema({
    name: String,
    description: String,
    type: String,
    presence:{
        authorization_full: [{type:Schema.Types.ObjectId, ref: 'CouncilMember'}],
        authorization_limited: [{type:Schema.Types.ObjectId, ref: 'CouncilMember'}]
    },
    date: Date,
    votings: [{type: Schema.Types.ObjectId, ref: 'Voting'}]
});


module.exports = mongoose.model('Session', sessionSchema);