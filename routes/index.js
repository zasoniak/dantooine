var express = require('express');
var router = express.Router();
var pdf = require('../dantooine_modules/document-generator/documentGenerator');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});


/* GET home page. */
router.get('/doctest', function (req, res, next) {
    pdf.getVotingProtocol("560d6895f86f64341cdb3565", function (err, votingProtocol) {
        if (err)
            res.render('index', {title: 'Express'});
        votingProtocol.pipe(res);
    });
});

module.exports = router;
