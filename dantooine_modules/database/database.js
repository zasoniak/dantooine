/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var configuration = require('./config');




/**
 * load data models before first use
 */
var Council = require("./models/council");
var CouncilMember = require("./models/voter");
var Device = require("./models/device");
var Session = require("./models/session");
var User = require("./models/user");
var Voting = require("./models/voting");
var SessionSnapshot = require("./models/sessionSnapshot");

/**
 * configuration of database connection
 */
function initialize() {
    mongoose.set('debug', true);
    mongoose.connect(configuration.url);
}


module.exports.Council = Council;
module.exports.CouncilMember = CouncilMember;
module.exports.Device = Device;
module.exports.Session = Session;
module.exports.User = User;
module.exports.Voting = Voting;
module.exports.SessionSnapshot = SessionSnapshot;
module.exports.initialize = initialize;
