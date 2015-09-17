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
var Council = require('../database/database').Council;
var Voting = require('../database/database').Voting;

/**
 * generate presence list for specified council
 * @param councilID
 * @returns {*} pdf file with members list
 */
module.exports.getPresenceList = function(councilID)
{
    var council = {};
    council.authorization_full=["a","b"];
    council.authorization_limited=["d","d2","d3"];
    var page = ejs.render(read(__dirname + '/views/presenceList.ejs', 'utf-8'),{authorization_full:council.authorization_full, authorization_limited:council.authorization_limited});
    return pdfGenerator(page,{pageSize:'A4'});

    //wyciagnac sesje
    //Council.findById(councilID).populate('authorization_full').populate('authorization_limited').exec(function (err, council) {
    //    if (err) return errorHandler(err);
    //
    //
    //
    //});

};

/**
 * generates voting summary protocol for specified voting
 * @param votingID
 * @returns {*} pdf file with voting summary protocol
 */
module.exports.getVotingProtocol = function(votingID)
{
    //wyciagnac glosowanie
    //wygenerowac html
    var page;
    return pdfGenerator(page,{pageSize:'A4'});
}