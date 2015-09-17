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
    extra_voters: [{device:{type: Schema.Types.ObjectId, ref:'Device'},
        name: String,
        surname: String,
        title: String,
        faculty: String,
        area_of_interests: String
    }]
});

module.exports = mongoose.model('Voting', votingSchema);