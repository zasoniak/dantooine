var express = require('express');
var router = express.Router();
var pdf = require('../dantooine_modules/document-generator/documentGenerator');

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

/* GET session info */
router.get('/session', function (req, res, next) {
    res.render('session', { title: 'Sesja M-15-8-REG' });
});

/* GET council overview */
router.get('/voters', function (req, res, next) {
    res.render('voters', { title: 'Rada Wydziału' });
});

/* POST new voter */
router.post('/voters', function (request, res, next) {
    console.log('Podano ' + request.body.last_name);
    res.redirect('/voters');
})

/* GET home page */
router.get('/', function(req, res, next) {
  //pdf.getPresenceList(0).pipe(res);
  res.render('index', { title: 'Elektroniczne głosowanie', system: 'System elektronicznego głosowania Rady Wydziału' });
});

module.exports = router;
