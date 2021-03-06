var express = require('express');
var router = express.Router();
var pdf = require('../dantooine_modules/document-generator');
var SessionFacade = require('../dantooine_modules/voting-engine');
dantooine = new SessionFacade(null);
var moment = require('moment');
moment.locale('pl');


/* PRIVATE ZONE */
module.exports = function(passport)
{
    /* FORMS */
    router.post('/forms/voting/:id', isAjax, function (request, response, next) {
        var id = request.params.id;
        var Voting = require('../dantooine_modules/database').Voting;
        Voting.findById(id, function (err, voting) {
            if (err) errorHandler(err);
            response.render('forms/votingEdit', {session: null, title: "Edytuj głosowanie", method: 'post', action: '/voting/'+id, voting: voting});
        });
    });

    /* FORMS */
    router.post('/forms/voting', isAjax, function (request, response, next) {
        var Session = require('../dantooine_modules/database').Session;
        Session.findById(request.body.sessionID, function (err, session) {
            if (err) errorHandler(err);
            response.render('forms/voting', {session: session, title: "Dodaj głosowanie", method: 'post', action: '/voting'});
        });
    });

    /* GET dashboard */
    router.get('/dashboard', function (req, res, next) {
        res.render('dashboard', { title: 'Dashboard' });
    });

    /* GET sessions screen */
    router.get('/sessions', isLoggedIn, function (request, response, next) {
        var Session = require('../dantooine_modules/database').Session;
        Session.find({}, function (err, sessions) {
            if (err) errorHandler(err);
            response.render('sessions', { title: 'Rada Wydziału', sessions: sessions, moment: moment });
        });
    });

    router.post('/sessions', isLoggedIn, function (request, response, next) {
        var Session = require('../dantooine_modules/database').Session;
        var date = moment(request.body.date, "DD.MM.YYYY");
        var session = new Session(
            {
                name: request.body.name,
                type: request.body.type,
                date: date.format(),
                description: request.body.description
            });
        session.save(function(err)
        {
            if(err) errorHandler(err);
            response.redirect('/session/'+session.id);
        });
    });

    /* EDIT session voting ajax request */
    router.post('/voting/:id', function (request, response, next) {
        // prepare things
        var variants = [];
        var voters = [];
        for(var i=0; i<request.body.variants.length; i++)
        {
            if (request.body.variants[i] != '') {
                variants[i]={
                    id: i,
                    content: request.body.variants[i]
                };
            }
        }
        for(var j=0; j<request.body.additional_voters_title.length; j++)
        {
            if (request.body.additional_voters_title[i] != '') {
                voters[i]={
                    title: request.body.additional_voters_title[i],
                    name: request.body.additional_voters_name[i],
                    surname: request.body.additional_voters_surname[i]
                };
            }
        }
        // save things
        var Voting = require('../dantooine_modules/database').Voting;
        Voting.findByIdAndUpdate(request.params.id,
            {
                type: request.body.variants_type,
                question: request.body.question,
                max_answers_number: request.body.max_allowed_variants,
                variants: (request.body.variants_type == 2) ? variants : [],
                allowed_to_vote: request.body.allowed_to_vote,
                extra_voters: (request.body.additional_voters === "on") ? voters : [],
                quorum: (request.body.quorum === "on"),
                absolute_majority: (request.body.absolute === "on")
            }).exec(function (err, voting) {
                var session_id = voting._session.toString();
                request.flash('message', 'Pomyślnie edytowano głosowanie');
                response.redirect('back');
        });
    });

    /* POST new session voting*/
    router.post('/voting', function (request, response, next) {
        var id = request.body.session_id;
        var Voting = require('../dantooine_modules/database').Voting;
        var Session = require('../dantooine_modules/database').Session;
        Session.findById(id, function (err, session) {
            if (err) errorHandler(err);
            var variants = [];
            var voters = [];
            for(var i=0; i<request.body.variants.length; i++)
            {
                if (request.body.variants[i] != '') {
                    variants[i]={
                        id: i,
                        content: request.body.variants[i]
                    };
                }
            }
            for(var j=0; j<request.body.additional_voters_title.length; j++)
            {
                if (request.body.additional_voters_title[i] != '') {
                    voters[i]={
                        title: request.body.additional_voters_title[i],
                        name: request.body.additional_voters_name[i],
                        surname: request.body.additional_voters_surname[i]
                    };
                }
            }
            console.log(request.body);
            var voting = new Voting({
                _session: session._id,
                type: request.body.variants_type,
                question: request.body.question,
                max_answers_number: request.body.max_allowed_variants,
                variants: (request.body.variants_type == 2) ? variants : [],
                allowed_to_vote: request.body.allowed_to_vote,
                extra_voters: (request.body.additional_voters === "on") ? voters : [],
                quorum: (request.body.quorum === "on"),
                absolute_majority: (request.body.absolute === "on")
            });
            session.votings.push(voting);
            session.save(function (err) {
                if (err) errorHandler(err);
                voting.save(function (err) {
                    if (err) errorHandler(err);
                    request.flash('message', 'Pomyślnie dodano głosowanie');
                    response.redirect('/session/'+id);
                })
            });
        });
    });

    /* DELETE session voting ajax request */
    router.delete('/session/:session/voting/:id', isAjax, function (request, response, next) {
        // delete things
        var Session = require('../dantooine_modules/database').Session;
        Session.findById(request.params.session, function (err, session) {
            if (err) errorHandler(err);
            session.votings.pull(request.params.id);
            session.save(function (err) {
                if (err) errorHandler(err);
                var Voting = require('../dantooine_modules/database').Voting;
                Voting.findByIdAndRemove(request.params.id).exec();
                request.flash('message', 'Pomyślnie usunięto głosowanie');
                response.sendStatus(204);
            });
        });
    });

    /* GET home page. */
    router.get('/doctest/:id', function (req, res, next) {
        pdf.getVotingProtocol(id, function (err, votingProtocol) {
            if (err) errorHandler(err);
            votingProtocol.pipe(res);
        });
    });

    /* DELETE supervisor */
    router.delete('/session/:id/supervisor/:supervisor', isAjax, function (request, response, next) {
        var id = request.params.id;
        var Session = require('../dantooine_modules/database').Session;
        Session.findById(id, function (err, session) {
            if (err) errorHandler(err);
            session.supervisors.pull(request.params.supervisor);
            session.save(function (err) {
                if (err) errorHandler(err);
                request.flash('message', 'Usunięto skrutatora');
                response.redirect('/session/'+id);
            });
        });
    });

    /* POST new counter */
    router.post('/session/:id/counter', function (request, response, next) {
        var id = request.params.id;
        var Session = require('../dantooine_modules/database').Session;
        Session.findById(id, function (err, session) {
            if (err) errorHandler(err);
            var supervisor = {
                role: request.body.role,
                name: request.body.name,
                surname: request.body.surname
            };
            session.supervisors.push(supervisor);
            session.save(function (err) {
                if (err) errorHandler(err);
                request.flash('message', 'Pomyślnie dodano skrutatora');
                response.redirect('/session/'+id);
            });
        });
    });

    /* GET session info */
    router.get('/session/:id/presence', function (request, response, next) {
        var id = request.params.id;
        pdf.getPresenceList(id, request,response);
        //response.download('/doctest/'+id, 'report.pdf');
    });

    router.get('/session/:id/protocols', function (request, response, next) {
        var id = request.params.id;
        pdf.getAllVotingProtocols(id, request,response);
        //response.download('/doctest/'+id, 'report.pdf');
    });

    router.get('/session/:id/screencast', function (request, response) {
        var id = request.params.id;
        var Session = require('../dantooine_modules/database').Session;
        Session.findById(id).populate('votings').exec(function(err, session) {
            if(err) errorHandler(err);
            response.render('screencast',
                {
                    session: session,
                    message: request.flash('message')
                });
        });
    });

    /* GET session info */
    router.get('/session/:id/cockpit', isLoggedIn, function (request, response, next) {
        var Session = require('../dantooine_modules/database').Session;
        var Voter = require('../dantooine_modules/database').Voter;
        Session.findById(request.params.id).populate('votings').exec(function(err, session) {
            if(err) errorHandler(err);
            Voter.find().sort({ surname: 1, name: 1 }).exec(function (err, voters) {
                if(err) errorHandler(err);
                dantooine.loadSession(session.id, function (err) {
                    if(err) errorHandler(err);
                    dantooine.startSession(function (err) {
                        if(err) errorHandler(err);
                    });
                });
                response.render('cockpit',
                    {
                        title: "Posiedzenie nr " + session.name,
                        session: session,
                        voters: voters,
                        moment: moment,
                        message: request.flash('message')
                    });
            });
        });
    });

    /* GET session info */
    router.get('/session/:id', isLoggedIn, function (request, response, next) {
        var id = request.params.id;
        var Session = require('../dantooine_modules/database').Session;
        Session.findById(id).populate('votings').exec(function(err, session) {
            if(err) errorHandler(err);
            response.render('session',
                {
                    title: "Posiedzenie nr " + session.name,
                    session: session,
                    moment: moment,
                    message: request.flash('message')
                });
        });
    });

    /* GET voters overview */
    router.get('/voters', isLoggedIn, function (request, response, next) {
        var Voter = require('../dantooine_modules/database').Voter;
        Voter.find().sort({ surname: 1, name: 1 }).exec(
            function (err, voters) {
                if (err) errorHandler(err);
                response.render('voters',
                    {
                        title: 'Rada Wydziału',
                        voters: voters,
                        message: request.flash('message')
                    });
        });
    });

    /* DELETE voter ajax request */
    router.delete('/voters/:id', isAjax, function (request, response, next) {
        var Voter = require('../dantooine_modules/database').Voter;
        Voter.findByIdAndRemove(request.params.id).exec();
        response.sendStatus(204);
    });

    /* EDIT voter ajax request */
    router.put('/voters/:id', isAjax, function (request, response, next) {
        var Voter = require('../dantooine_modules/database').Voter;
        Voter.findByIdAndUpdate(request.params.id,
            {
                name: request.body.name,
                surname: request.body.surname,
                title: request.body.title,
                institute: request.body.institute,
                specialty: request.body.specialty,
                group: request.body.group
            }).exec();
        request.flash('message', 'Pomyślnie edytowano głosującego '+voter.name+' '+voter.surname);
        response.sendStatus(204);
    });

    /* POST new voter */
    router.post('/voters', function (request, response, next) {
        var Voter = require('../dantooine_modules/database').Voter;
        var voter = new Voter(
            {
                name: request.body.name,
                surname: request.body.surname,
                title: request.body.title,
                institute: request.body.institute,
                specialty: request.body.specialty,
                group: request.body.group
            });
        voter.save(function(err)
        {
            if(err) errorHandler(err);
            request.flash('message', 'Pomyślnie dodano głosującego '+voter.name+' '+voter.surname);
            response.redirect('/voters');
        });
    });

    /* PUBLIC ZONE */

    /* GET signup page */
    router.get('/signup', function (request, response, next) {
        response.render('signup',
            {
                message: request.flash('message'),
                error: request.flash('error')
            });
    });

    /* GET signup page */
    router.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/', // redirect to home
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));


    /* POST signup page */
    router.post('/login', passport.authenticate('local-login', {
        successRedirect: '/sessions', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the login page if there is an error
        failureFlash: true // allow flash messages
    }));

    /* GET logout page */
    router.get('/logout', function (request, response) {
        request.logout();
        request.flash('message', 'Wylogowano z systemu');
        response.redirect('/');
    });

    /* GET home page */
    router.get('/', function(request, response, next) {
        response.render('index',
            {
                message: request.flash('message'),
                error: request.flash('error')
            });
    });

    return router;
};

// route middleware to make sure
function isLoggedIn(request, response, next) {
    // if user is authenticated in the session, carry on
    if (request.isAuthenticated())
        return next();
    // if they aren't redirect them to the starting page
    response.redirect('/');
}

function isAjax(request, response, next) {
    // if request is ajax, carry on
    if (request.xhr)
        return next();
    // if not, send error page
    response.sendStatus(403);
}

