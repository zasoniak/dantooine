/**
 * Created by Mateusz on 17.09.2015.
 */

var mongoose = require('mongoose');

var deviceSchema = mongoose.Schema({
    MAC: String,
    authorization: Number,
    peripheral:
    {
        id: String,
        address: String,
        addressType: String,
        connectable: String,
        advertisement: String,
        rssi: String
    }
});

// create the model for council and expose it to our app
module.exports = mongoose.model('Device', deviceSchema);
