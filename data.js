'use strict';

const { Database } = require('sqlite3').verbose();
const { readFile } = require('fs-extra');
const uuid = require('uuid').v4;
const { promisify } = require('util');
const { join, extname } = require('path');
const { Files } = require('files3');
const { getType } = require('mime');
const sharp = require('sharp');

const files3 = new Files(process.env.S3_BUCKET, true);

class Data {
	constructor () {
		this._STRINGS = ['name', 'category', 'identifier', 'notes', 'images'];
		this._DB_FILE = process.env['DB_FILE'] || 'inventory.db';
		this._DB = new Database(this._DB_FILE);
		this._SRE = new RegExp(`'`, 'g');
		this._setup();
	}

	async _setup () {
		let setupScript = '';
		this._DB.run = promisify(this._DB.run);
		this._DB.get = promisify(this._DB.get);
		this._DB.all = promisify(this._DB.all);
		try {
			setupScript = await readFile('./sql/setup.sql', 'utf8')
		} catch (err) {
			console.error('Error loading setup script.')
			console.error(err);
			process.exit(1);
		}
		try {
			await this._DB.run(setupScript);
		} catch (err) {
			console.error('Error executing setup script.');
			console.error(err);
			process.exit(2);
		}
	}

/*
	id VARCHAR PRIMARY KEY,
	created INTEGER,
	updated INTEGER,
	name VARCHAR,
	category VARCHAR,
	identifier VARCHAR,
	notes VARCHAR,
	trash INTEGER DEFAULT 0,
	sell INTEGER DEFAULT 0,
	keep INTEGER DEFAULT 0,
	images VARCHAR
*/
	async create (row) {
		const keys = Object.keys(row);
		const now = Date.now();
		const values = [
			uuid(),
			now,
			now
		];
		let cols = `id, created, updated, `;
		let vals = `?, ?, ?, `;
		let stm = null;
		let query = '';
		for (let key of keys) {
			if (this._STRINGS.indexOf(key) !== -1) {
				values.push(this._safeString(row[key]));
			} else {
				values.push(row[key]);
			}
			cols += key
			vals += '?'
			if (keys.indexOf(key) !== keys.length - 1) {
				cols += ', '
				vals += ', '
			}
		}

		query = `INSERT OR IGNORE INTO inventory (${cols}) VALUES (${vals})`;

		try {
			stm = this._DB.prepare(query);
		} catch (err) {
			console.error('Error preparing statement');
			console.error(err);
			return false;
		}

		try {
			stm.run(values);
			stm.finalize();
		} catch (err) {
			console.error('Error executing query.');
			console.error(query);
			console.error(values);
			console.error(err);
			return false;
		}

		return true;
	}

	async update (id, update) {
		const keys = Object.keys(update);
		const now = Date.now();
		const values = [];
		let cols = ``;
		let stm = null;
		let query = '';

		for (let key of keys) {
			if (this._STRINGS.indexOf(key) !== -1) {
				values.push(this._safeString(update[key]));
			} else {
				values.push(update[key]);
			}
			cols += `${key} = ?`
			if (keys.indexOf(key) !== keys.length - 1) {
				cols += ', '
			}
		}
		values.push(id);

		query = `UPDATE inventory SET ${cols} WHERE id = ?;`;

		try {
			stm = this._DB.prepare(query);
		} catch (err) {
			console.error('Error preparing statement');
			console.error(query);
			console.error(err);
			return false;
		}

		try {
			stm.run(values);
			stm.finalize();
		} catch (err) {
			console.error('Error executing update query.');
			console.error(query);
			console.error(values);
			console.error(err);
			return false;
		}

		return true;
	}

	async read (filter = '') {
		let query = 'SELECT * FROM inventory ORDER BY category, name;';
		let rows = [];
		if (filter !== '') {
			query = `SELECT * FROM inventory WHERE (${filter}) ORDER BY category, name;`;
		}
		try {
			rows = await this._DB.all(query);
		} catch (err) {
			console.error('Error selecting from inventory.');
			console.error(query);
			console.error(err);
			return [];
		}
		return rows;
	}

	async categories () {
		const query = `SELECT DISTINCT category FROM inventory WHERE category IS NOT NULL ORDER BY category;`;
		let rows = [];
		try {
			rows = await this._DB.all(query);
		} catch (err) {
			console.error('Error getting categories.');
			console.error(query);
			console.error(err);
			return [];
		}
		return rows;
	}

	async del (id) {
		const query = `DELETE FROM inventory WHERE id = '${id}';`;
		try {
			await this._DB.run(query);
		} catch (err) {
			console.error(`Error deleting record.`);
			console.error(query);
			console.error(err);
			return false;
		}
		return true;
	}

	async file (file) {
		const id = uuid();
		const ext = extname(file.originalname);
		const filePath = `${id}${ext}`;
		const mimetype = getType(filePath);
		let outputBuffer;
		
		try {
			outputBuffer = await sharp(file.buffer)
				.resize(2048, 2048, {
					fit: sharp.fit.inside,
					withoutEnlargement: true
				})
				.jpeg({quality: 80})
				.toBuffer();
		} catch (err) {
			console.error(err);
			return null
		}
		
		try {
			await files3.create(file, filePath);
		} catch (err) {
			console.error(err);
			return null
		}

		return filePath;
	}

	_safeString (str) {
		return str.replace(this._SRE, `''`);
	}
}

module.exports = Data