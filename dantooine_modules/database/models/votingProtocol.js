/**
 * Created by Mateusz on 03.10.2015.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var votingProtocolSchema = new Schema({
    type: String,
    title: String,
    contents: String,
    variants: [
        {
            id: Number,
            contents: String
        }
    ],
    session: {
        name: String,
        description: String,
        type: String,
        date: Date
    },
    authorization: String,
    authorized_voters: [
        {
            name: String,
            surname: String,
            title: String,
            faculty: String,
            area_of_interests: String,
            privileges: String,
            external_role: String
        }
    ],
    presence: [
        {
            name: String,
            surname: String,
            title: String,
            faculty: String,
            area_of_interests: String,
            privileges: String,
            external_role: String,
            device_MAC: String
        }
    ],
    answers: [
        {
            MAC: String,
            answers: [Number],
            timestamp: {type: Date, default: Date.now}
        }
    ]
});


module.exports = mongoose.model('VotingProtocol', votingProtocolSchema);