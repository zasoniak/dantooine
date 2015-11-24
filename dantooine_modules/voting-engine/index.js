/**
 * Created by zasoski on 21.10.2015.
 */


/**
 * Created by zasoski on 21.10.2015.
 */

var SessionDataModel = require('../database/database').Session;


function SessionFacade() {
    this.session = null;
}

/**
 *
 * @param sessionID
 */
SessionFacade.prototype.loadSession = function (sessionID) {
    var self = this;
    SessionDataModel.findById(sessionID).populate('votings').exec(function (err, sessionData) {
        if (err) return false;
        self.session = sessionData;
        return true;
    });
};



SessionFacade.prototype.startSession = function (callback) {

};

SessionFacade.prototype.setPresence = function (voterID, value, callback) {


    if(!this.checkQuorum())
    callback(true,null);
};


SessionFacade.prototype.endSession = function () {

};

SessionFacade.prototype.checkQuorum = function () {
    var presenceSummary = this.session.presence;
    for(var it=0; it<this.session.votings.length;it++)
    {
        this.session.votings[it].checkQuorum(presenceSummary, function(err,voting)
        {
            if(err) return false;
        });
    }
    return true;

};

SessionFacade.prototype.nextQuestion = function (votingID, callback) {

};

SessionFacade.prototype.startQuestion = function () {

};

SessionFacade.prototype.revertQuestion = function (votingID, callback) {

};

SessionFacade.prototype.endQuestion = function () {

};