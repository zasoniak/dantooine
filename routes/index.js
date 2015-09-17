var express = require('express');
var router = express.Router();
var pdf = require('../dantooine_modules/document-generator/documentGenerator');
/* GET home page. */
router.get('/', function(req, res, next) {

  //pdf.getPresenceList(0).pipe(res);
  res.render('index', { title: 'Express' });
});

module.exports = router;
