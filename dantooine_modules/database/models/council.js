/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var councilSchema = mongoose.Schema({
    _creator: { type: Schema.Types.ObjectId, ref: 'User'},
    members: [{type:Schema.Types.ObjectId, ref: 'CouncilMember'}],
    sessions: [{type:Schema.Types.ObjectId, ref: 'Session'}]
});

// create the model for council and expose it to our app
module.exports = mongoose.model('Council', councilSchema);