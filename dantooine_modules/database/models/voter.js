/**
 * Created by Mateusz on 17.09.2015.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var voterSchema = mongoose.Schema({
    name: String,
    surname: String,
    title: String,
    faculty: String,
    area_of_interests: String,
    privileges: String,
    external_role: String,
    device: {type: Schema.Types.ObjectId, ref: 'Device'}
});

module.exports = mongoose.model('Voter', voterSchema);