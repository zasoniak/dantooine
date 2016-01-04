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

var fs = require('fs');
var async = require('async');
var archiver = require('archiver');
var EasyZip = require('easy-zip').EasyZip;


var getPresenceList = function (request, response) {
    Voter.find().exec(function (err, voters) {
        if (err) response.status(500).send('Something broke!');
        var page = ejs.render(read(__dirname + '/views/presenceList.ejs', 'utf-8'), {voters: voters});
        pdfGenerator(page, {pageSize: 'A4'}).pipe(response);
    });
};


var getVotingProtocol = function (votingID, request, response) {
    Voting.findById(votingID, function (err, voting) {
        if (err) response.status(500).send('Something broke!');
        var page = ejs.render(read(__dirname + '/views/votingProtocol.ejs', 'utf-8'), {voting: voting});
        pdfGenerator(page, {pageSize: 'A4'}).pipe(response);
    });
};

var getAllVotingProtocols = function (sessionID, request, response) {
    Session.findById(sessionID).populate('votings').exec(function (err, session) {
        if (err) response.status(500).send('Something broke!');
        var page = null;
        async.series([function (callback) {
            async.each(session.votings, function (voting, callback2) {
                page = ejs.render(read(__dirname + '/views/votingProtocol.ejs', 'utf-8'), {voting: voting});
                pdfGenerator(page, {pageSize: 'A4'}).pipe(fs.createWriteStream(__dirname + '/tmp/' + voting.id + '.pdf'));
                callback2(null);
            }, function (err) {
                if (err) response.status(500).send('Something broke!');
                callback(err, null);
            });
        }, function (callback) {
            var path = __dirname + "/tmp/";
            //var archive = archiver('zip');
            //archive.pipe(response);
            //archive.bulk([
            //    { expand: true, cwd: path, src: ['*.pdf'], dest: 'protokoly.pdf'}
            //]);
            //archive.finalize();

            var zip = new EasyZip();
            zip.zipFolder(path, function () {
                zip.writeToResponse(response, 'protocoly');
                callback(null);
            });
        }]);

    });
};

module.exports.getPresenceList = getPresenceList;
module.exports.getVotingProtocol = getVotingProtocol;
module.exports.getAllVotingProtocols = getAllVotingProtocols;