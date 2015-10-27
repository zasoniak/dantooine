/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var sessionSchema = new Schema({
    name: String,
    description: String,
    type: String,
    presence: [{type: Schema.Types.ObjectId, ref: 'Voter'}],
    supervisors: [
        {
            role: String,
            name: String,
            surname: String
        }
    ],
    date: Date,
    state: Number,
    devices: [{type: Schema.Types.ObjectId, ref: 'Device'}],
    votings: [{type: Schema.Types.ObjectId, ref: 'Voting'}]
});


module.exports = mongoose.model('Session', sessionSchema);