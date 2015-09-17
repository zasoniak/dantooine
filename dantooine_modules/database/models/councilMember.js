/**
 * Created by Mateusz on 17.09.2015.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var councilMemberSchema = mongoose.Schema({
    name: String,
    surname: String,
    title: String,
    faculty: String,
    area_of_interests: String
});

module.exports = mongoose.model('CouncilMember', councilMemberSchema);