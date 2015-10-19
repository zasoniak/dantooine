/**
 * Created by Mateusz on 17.09.2015.
 */

var mongoose = require('mongoose');

var voterSchema = mongoose.Schema({
    name: String,
    surname: String,
    title: String,
    institute: String,
    specialty: String,
    group: Number
});

module.exports = mongoose.model('Voter', voterSchema);