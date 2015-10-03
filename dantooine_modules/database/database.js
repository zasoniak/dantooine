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
var VotingProtocol = require("./models/votingProtocol");

/**
 * configuration of database connection
 */
function initialize() {
    mongoose.set('debug', true);
    mongoose.connect(configuration.url);
}

/**
 *
 * @param votingID
 * @param callback
 */
function saveVotingProtocolData(votingID, callback)
{
    Voting.findById(votingID).populate("_session").populate("_session._council").exec(function(err, voting){
        if(err) callback(err,null);

        console.log(voting);


        var protocolDataSnapshot = new VotingProtocol({
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
        callback(null, protocolDataSnapshot);
    });
}

/**
 *
 * @param sessionID
 * @param callback
 */
function saveSessionProtocolData(sessionID, callback)
{

}


module.exports.Council = Council;
module.exports.CouncilMember = CouncilMember;
module.exports.Device = Device;
module.exports.Session = Session;
module.exports.User = User;
module.exports.Voting = Voting;
module.exports.VotingProtocol = VotingProtocol;
module.exports.initialize = initialize;
module.exports.saveVotingProtocolData = saveVotingProtocolData;
module.exports.saveSessionProtocolData = saveSessionProtocolData;