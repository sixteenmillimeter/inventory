'use strict';

if (process.argv.indexOf('-d') !== -1 || process.argv.indexOf('--dev') !== -1) {
	require('dotenv').config()
}

const PORT = process.env['PORT'] || 3007;

const express = require('express');
const exphbs  = require('express-handlebars');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const routes = require('./routes.js');
const helpers = require('./handlebars-helpers.js');
 
const app = express();

 
app.engine('handlebars', exphbs({ helpers }) );
app.set('view engine', 'handlebars');

app.use(helmet());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
	limit : '10mb', 
	extended: true
}));

app.use('/assets', express.static('./assets'));
app.use('/images', express.static('./images'));
 
routes(app);
 
app.listen(PORT);