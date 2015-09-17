/**
 * Created by Mateusz on 17.09.2015.
 */
var mongoose = require('mongoose');
var configuration = require('./config');

/**
 * configuration of database connection
 */
function initialize() {
    mongoose.connect(configuration.url);
}

/**
 * load data models before first use
 */
var Council = require("./models/council");
var CouncilMember = require("./models/councilMember");
var Device = require("./models/device");
var Session = require("./models/session");
var User = require("./models/user");
var Voting = require("./models/voting");

module.exports.Council = Council;
module.exports.CouncilMember = CouncilMember;
module.exports.Device = CouncilMember;
module.exports.Session = CouncilMember;
module.exports.User = CouncilMember;
module.exports.Voting = CouncilMember;
module.exports.initialize = initialize;