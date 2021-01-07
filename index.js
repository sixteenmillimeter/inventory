'use strict';

require('dotenv').config()

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
 
routes(app);
 
app.listen(PORT);
console.log(`Listening on port ${PORT}`)