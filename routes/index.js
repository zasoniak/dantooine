var express = require('express');
var router = express.Router();
var pdf = require('../dantooine_modules/document-generator/documentGenerator');
var moment = require('moment');
moment.locale('pl');

/* PRIVATE ZONE */
module.exports = function(passport)
{

    /* GET dashboard */
    router.get('/dashboard', function (req, res, next) {
        res.render('dashboard', { title: 'Dashboard' });
    });

    /* GET session edit */
    router.get('/session/new', function (req, res, next) {
        res.render('session_edit', { title: 'Nowa sesja' });
    });

    /* GET session edit */
    router.get('/session/edit', function (req, res, next) {
        res.render('session_edit', { title: 'Edycja sesji' });
    });

    /* GET sessions screen */
    router.get('/sessions', isLoggedIn, function (request, response, next) {
        var Session = require('../dantooine_modules/database/database').Session;
        Session.find({}, function (err, sessions) {
            if (err) errorHandler(err);
            response.render('sessions', { title: 'Rada Wydziału', sessions: sessions, moment: moment });
        });
    });

    router.post('/sessions', function (request, response, next) {
        var Session = require('../dantooine_modules/database/database').Session;
        var session = new Session(
            {
                name: request.body.name,
                type: request.body.type,
                date: request.body.date,
                description: request.body.description
            });
        session.save(function(err)
        {
            if(err) errorHandler(err);
            response.redirect('/session/'+session.id);
        });
    });

    /* POST new session voting*/
    router.post('/voting', function (request, response, next) {
        var id = request.body.session_id;
        var Voting = require('../dantooine_modules/database/database').Voting;
        var Session = require('../dantooine_modules/database/database').Session;
        Session.findById(id, function (err, session) {
            if (err) errorHandler(err);
            var variants = [];
            for(var i=0; i<request.body.answers.length; i++)
            {
                if (request.body.answers[i] != '') {
                    variants[i]={
                        id: i,
                        content: request.body.answers[i]
                    };
                }
            }
            var voting = new Voting({
                _session: session._id,
                question: request.body.question,
                variants: variants,
                authorization_level:1,
                type:0
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

    /* GET session info */
    router.get('/session/:id', function (request, response, next) {
        var id = request.params.id;
        var Session = require('../dantooine_modules/database/database').Session;
        Session.findById(id, function(err, session) {
            if(err) errorHandler(err);
            response.render('session',
                {
                    title: session.name,
                    session: session,
                    moment: moment,
                    message: request.flash('message')
                });
        });
    });

    /* GET voters overview */
    router.get('/voters', function (request, response, next) {
        var Voter = require('../dantooine_modules/database/database').Voter;
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

    /* POST new voter */
    router.post('/voters', function (request, response, next) {
        var Voter = require('../dantooine_modules/database/database').Voter;
        var voter = new Voter(
            {
                name: request.body.name,
                surname: request.body.surname,
                title: request.body.title,
                faculty: request.body.institute,
                area_of_interests: request.body.specialty,
                privileges: request.body.privileges
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

    /* GET home page. */
    router.get('/doctest', function (req, res, next) {
        pdf.getVotingProtocol("560d6895f86f64341cdb3565", function (err, votingProtocol) {
            if (err)
                res.render('index', {title: 'Express'});
            votingProtocol.pipe(res);
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

