/**
 * Created by Mateusz on 17.09.2015.
 */

var mongoose = require('mongoose');

var deviceSchema = mongoose.Schema({
    number: Number,
    MAC: String,
    type: String,
    authorization: String,
    firmware: Number
});

// create the model for council and expose it to our app
module.exports = mongoose.model('Device', deviceSchema);
