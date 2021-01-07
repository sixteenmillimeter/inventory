'use strict';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { Files } = require('files3');

const Data = require('./data.js');
const data = new Data();
const files3 = new Files(process.env.S3_BUCKET, false);

async function home (req, res) {
	let rows = [];
	let count = null;
	try {
		rows = await data.read();
	} catch (err) {
		console.error(err);
	}
	if (!rows) {
		res.status(500);
	} else if (rows.length > 0) {
		count = rows.length;
	}
	res.render('home', { title : 'Inventory', rows, count });
}

async function trash (req, res) {
	let rows = [];
	let count = null;
	try {
		rows = await data.read('trash != 0');
	} catch (err) {
		console.error(err);
	}
	if (!rows) {
		res.status(500);
	} else if (rows.length > 0) {
		count = rows.length;
	}
	res.render('home', { title : 'Inventory - Trash', action : 'trash', rows, count });
}

async function keep (req, res) {
	let rows = [];
	let count = null;
	try {
		rows = await data.read('keep != 0');
	} catch (err) {
		console.error(err);
	}
	if (!rows) {
		res.status(500);
	} else if (rows.length > 0) {
		count = rows.length;
	}
	res.render('home', { title : 'Inventory - Keep', action : 'keep', rows, count });
}

async function sell (req, res) {
	let rows = [];
	let count = null;
	try {
		rows = await data.read('sell != 0');
	} catch (err) {
		console.error(err);
	}
	if (!rows) {
		res.status(500);
	} else if (rows.length > 0) {
		count = rows.length;
	}
	res.render('home', { title : 'Inventory - Sell', action : 'sell', rows, count });
}

async function getCreate (req, res) {
	let categories = [];
	try {
		categories = await data.categories();
	} catch (err) {
		console.error(err);
	}
	res.render('create', { title : 'Add Resource', categories });
}

async function create (req, res) {
	const row = {};
	let success = false;
	if (req.body) {
		if (req.body.name && req.body.name !== '') {
			row.name = req.body.name
		}
		if (req.body.identifier && req.body.identifier !== '') {
			row.identifier = req.body.identifier;
		}
		if (req.body.category && req.body.category !== '' && req.body.category !== '- Category -') {
			row.category = req.body.category;
		}
		if (req.body.action && req.body.action !== '') {
			if (req.body.action === 'keep') {
				row.keep = 1;
			} else if (req.body.action === 'trash') {
				row.trash = 1;
			} else if (req.body.action === 'sell') {
				row.sell = 1;
			}
		}
		if (req.body.notes && req.body.notes !== '') {
			row.notes = req.body.notes;
		}
	}
	if (req.uploads && req.uploads.image && req.uploads.image !== '') {
		row.image = req.uploads.image;
	}

	try {
		success = await data.create(row);
	} catch (err) {
		console.error(err);
	}
	res.redirect('/add')
}

async function updateTrash (req, res) {
	const back = req.header('Referer') || '/';
	const update = {
		trash : 1,
		sell : 0,
		keep : 0
	};
	let success = false;
	let id = null;
	if (req.params && req.params.id) {
		id = req.params.id;
		try {
			success = await data.update(id, update);
		} catch (err) {
			console.error(err);
		}
	}
	res.redirect(back);
}
async function updateSell (req, res) {
	const back = req.header('Referer') || '/';
	const update = {
		trash : 0,
		sell : 1,
		keep : 0
	};
	let success = false;
	let id = null;
	if (req.params && req.params.id) {
		id = req.params.id;
		try {
			success = await data.update(id, update);
		} catch (err) {
			console.error(err);
		}
	}
	res.redirect(back);
}
async function updateKeep (req, res) {
	const back = req.header('Referer') || '/';
	const update = {
		trash : 0,
		sell : 0,
		keep : 1
	};
	let success = false;
	let id = null;
	if (req.params && req.params.id) {
		id = req.params.id;
		try {
			success = await data.update(id, update);
		} catch (err) {
			console.error(err);
		}
	}
	res.redirect(back);
}

async function postUpdate (req, res) {
	const row = {};
	let success = false;
	let id = null;

	if (req.params && req.params.id) {
		id = req.params.id;
		if (req.body) {
			if (req.body.name && req.body.name !== '') {
				row.name = req.body.name
			}
			if (req.body.identifier && req.body.identifier !== '') {
				row.identifier = req.body.identifier;
			}
			if (req.body.category && req.body.category !== '' && req.body.category !== '- Category -') {
				row.category = req.body.category;
			}
			if (req.body.action && req.body.action !== '') {
				if (req.body.action === 'keep') {
					row.keep = 1;
				} else if (req.body.action === 'trash') {
					row.trash = 1;
				} else if (req.body.action === 'sell') {
					row.sell = 1;
				}
			}
			if (req.body.notes && req.body.notes !== '') {
				row.notes = req.body.notes;
			}
		}
		if (req.uploads && req.uploads.image && req.uploads.image !== '') {
			row.image = req.uploads.image;
		}

		if (( Object.keys(row) ).length > 0) {
			try {
				success = await data.update(id, row);
			} catch (err) {
				console.error(err);
			}
		}
	}
	res.redirect(`/read/${id}`)
}

async function read (req, res) {
	let rows = [];
	let categories = [];
	let id = null;
	if (req.params && req.params.id) {
		id = req.params.id;
		try {
			rows = await data.read(`id = '${id}'`)
		} catch (err) {
			console.error(err);
		}
		try {
			categories = await data.categories();
		} catch (err) {
			console.error(err);
		}
	}
	if (rows.length === 0) {
		res.status(404);
		return res.send(`${id} not found`);
	}
	res.render('create', { title : `${rows[0].name}`, categories, data : rows[0] });
}

async function getDelete (req, res) {
	let rows = [];
	let id = null;
	if (req.params && req.params.id) {
		id = req.params.id;
		try {
			rows = await data.read(`id = '${id}'`)
		} catch (err) {
			console.error(err);
		}
	}
	if (rows.length === 0) {
		res.status(404);
		return res.send(`${id} not found`);
	}
	res.render('delete', { title : `Delete ${rows[0].name}`, data : rows[0] });
}

async function postDelete (req, res) {
	let id = null;
	let success = false;
	if (req.params && req.params.id) {
		id = req.params.id;
		try {
			success = await data.del(id)
		} catch (err) {
			console.error(err);
		}
	}
	res.redirect('/');
}

function fileFields (fields) {
	return upload.fields(fields);
}

async function fileUpload (req, res, next) {
	let fields = [];
	let results = {};
	if (req.files) {
		fields = Object.keys(req.files);
	} else {
		return next();
	}
	for (let field of fields) {
		for (let file of req.files[field] ) {
			try {
				results[field] = await data.file(file);
			} catch (err) {
				console.error(err);
				return next(err);
			}
		}
	}
	req.uploads = results;
	return next();
}

async function getImages (req, res, next) {
	let key = null;
	let file = null;

	if (req.params && req.params.key) {
		key = req.params.key
		try {
			file = await files3.read(key);
		} catch (err) {
			console.error(err);
			return next(err);
		}
		res.writeHead(200, {
	        'Content-Type': 'image/jpeg',
	        'Content-Length': file.length
	    });
	    res.end(file);
	}

	return next();
}

module.exports = function routes (app) {
	app.get('/', home);
	app.get('/sell', sell);
	app.get('/trash', trash);
	app.get('/keep', keep);

	app.get('/read/:id', read);
	app.post('/update/:id', fileFields([{ name : 'image', maxCount : 1}]), fileUpload, postUpdate)

	app.get('/add', getCreate);
	app.post('/add', fileFields([{ name : 'image', maxCount : 1}]), fileUpload, create);

	app.get('/trash/:id', updateTrash);
	app.get('/sell/:id', updateSell);
	app.get('/keep/:id', updateKeep);

	app.get('/delete/:id', getDelete);
	app.post('/delete/:id', postDelete);

	app.get('/images/:key', getImages);
}