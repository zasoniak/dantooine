/**
 * Created by Mateusz on 17.09.2015.
 */

/**
 * pdf generator import
 * @type {wkhtmltopdf|exports|module.exports}
 */
var pdfGenerator = require('wkhtmltopdf');

/**
 * configuring pdfGenerator
 * @type {string}
 */
pdfGenerator.command = require("./config").systemPath;

/**
 * templating engine import
 * @type {exports|module.exports}
 */
var ejs = require('ejs');

/**
 * reading files functionality
 */
var read = require('fs').readFileSync;

/**
 * required data models imports
 */
var Voter = require('../database').Voter;
var Voting = require('../database').Voting;
var Session = require('../database').Session;

/**
 * generate presence list for specified council
 * @param councilID
 * @returns {*} pdf file with members list
 */
module.exports.getPresenceList = function(sessionID, callback)
{
    //Session.findById(sessionID).populate("_council").exec(function (err,session) {
    //    console.log(session);
    //    if(err) errorHandler(err);
    //    session._council.populate('voters', function (err, council) {
    //        console.log("dziala");
    //        var page = ejs.render(read(__dirname + '/views/presenceList.ejs', 'utf-8'),{session:session, voters: council.voters});
    //        return pdfGenerator(page,{pageSize:'A4'});
    //    });
    //});

    Voter.find().exec(function (err, voters) {
        var page = ejs.render(read(__dirname + '/views/presenceList.ejs', 'utf-8'),{voters: voters});
        callback(null, pdfGenerator(page,{pageSize:'A4'}));
    });
};

/**
 * generates voting summary protocol for specified voting
 * @param votingID
 * @returns {*} pdf file with voting summary protocol
 */
module.exports.getVotingProtocol = function(votingID, callback)
{
    var page ="error";
    Voting.findById(votingID, function(err,voting){
        if(err) callback(err,null);
        page = ejs.render(read(__dirname + '/views/votingProtocol.ejs', 'utf-8'),{voting:voting});
        callback(null,pdfGenerator(page,{pageSize:'A4'}));
    });
};