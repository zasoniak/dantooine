var express = require('express');
var router = express.Router();
var pdf = require('../dantooine_modules/document-generator/documentGenerator');
/* GET home page. */
router.get('/', function(req, res, next) {

/* PRIVATE ZONE */

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
router.get('/sessions', function (req, res, next) {
    res.render('sessions', { title: 'Sesje i głosowania' });
});

router.post('/sessions', function (request, response, next) {
    console.log('Podano ' + request.body.name);
    var id = 1;
    response.redirect('/session/'+id);
});

/* POST new session voting*/
router.post('voting', function (request, response, next) {
    var id = request.body.session_id;
    response.redirect('/session/'+id);
});

/* GET session info */
router.get('/session/:id', function (request, response, next) {
    var id = request.params.id;
    response.render('session', { title: 'Sesja M-15-8-REG', session_id: id });
});

/* GET voters overview */
router.get('/voters', function (req, res, next) {
    res.render('voters', { title: 'Rada Wydziału' });
});

/* POST new voter */
router.post('/voters', function (request, res, next) {
    console.log('Podano ' + request.body.last_name);
    res.redirect('/voters');
});

/* PUBLIC ZONE */

/* GET signup page */
router.get('/signup', function (req, res, next) {
    res.render('signup', { title: 'Elektroniczne głosowanie', system: 'System elektronicznego głosowania Rady Wydziału' });
});

/* GET home page */
router.get('/', function(req, res, next) {
  //pdf.getPresenceList(0).pipe(res);
  res.render('index', { title: 'Elektroniczne głosowanie', system: 'System elektronicznego głosowania Rady Wydziału' });

/* GET home page. */
router.get('/doctest', function (req, res, next) {
    pdf.getVotingProtocol("560d6895f86f64341cdb3565", function (err, votingProtocol) {
        if (err)
            res.render('index', {title: 'Express'});
        votingProtocol.pipe(res);
    });
});

module.exports = router;
