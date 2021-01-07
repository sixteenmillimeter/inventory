'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = require("uuid").v4;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const crypto_1 = require("crypto");
const mime_1 = require("mime");
const aws_sdk_1 = require("aws-sdk");
const os_1 = require("os");
const s3Stream = require("s3-upload-stream");
//import * as sharp from 'sharp';
//const log = require('log')('file');
const TMP_DIR = (typeof process.env.FILE_DIR !== 'undefined') ? process.env.TMP_DIR : (os_1.tmpdir() || '/tmp');
class Files {
    /**
     * @constructor
     *
     */
    constructor(bucket, writeable = true) {
        this.writeable = false;
        const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'YOUR-ACCESSKEYID';
        const S3_ACCESS_SECRET = process.env.S3_ACCESS_SECRET || 'YOUR-SECRETACCESSKEY';
        const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
        const spacesEndpoint = new aws_sdk_1.Endpoint(S3_ENDPOINT);
        const s3Config = {
            accessKeyId: S3_ACCESS_KEY,
            secretAccessKey: S3_ACCESS_SECRET,
            endpoint: spacesEndpoint,
            signatureVersion: 'v4'
        };
        this.endpoint = S3_ENDPOINT;
        this.s3 = new aws_sdk_1.S3(s3Config);
        this.s3Stream = s3Stream(this.s3);
        this.bucket = bucket;
        this.writeable = writeable;
    }
    /**
     * Create a SHA256 hash of any data provided.
     **/
    hash(data) {
        return crypto_1.createHash('sha256').update(data).digest('base64');
    }
    /**
     * Read file from disk as buffer and create hash of the data.
     **/
    async hashFile(filePath) {
        let data;
        try {
            data = await fs_extra_1.readFile(filePath);
        }
        catch (err) {
            console.error(err);
        }
        return this.hash(data);
    }
    /**
     * create a file object on an S3 bucket and upload data.
     * Reads into memory
     **/
    async create(file, keyName) {
        if (!this.writeable)
            return false;
        const id = v4_1();
        const ext = mime_1.getExtension(file.mimetype);
        const key = typeof keyName !== 'undefined' ? keyName : `${id}.${ext}`;
        const webPath = path_1.join('/files/', this.bucket, key);
        const publicPath = path_1.join(`${this.bucket}.${this.endpoint}`, key);
        const record = {
            id,
            created: +new Date(),
            name: file.originalname,
            public: publicPath,
            path: webPath,
            path_hash: this.hash(webPath),
            hash: null,
            type: file.mimetype,
            size: null
        };
        const params = {
            Bucket: this.bucket,
            Key: key,
            Body: null
        };
        /*if (file.mimetype === 'image/jpeg') {
            try {
                 file.buffer = await this.optimizeJpeg(file.buffer);
            } catch (err) {
                console.error(err)
            }
        }*/
        //only accept jpegs
        params.Body = file.buffer;
        record.hash = this.hash(file.buffer);
        record.size = file.buffer.byteLength;
        return new Promise((resolve, reject) => {
            return this.s3.putObject(params, function (err, data) {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                else {
                    console.log(`Saved file ${record.path}`);
                    return resolve(record);
                }
            });
        });
    }
    /*
     *  Create an s3 record using only a path reference of a local file
     *  Reads into memory
     */
    async createFromPath(filePath, keyName) {
        const filename = path_1.basename(filePath);
        const mimetype = mime_1.getType(filePath);
        const key = typeof keyName !== 'undefined' ? keyName : null;
        let file;
        let buffer;
        try {
            buffer = await fs_extra_1.readFile(filePath);
        }
        catch (err) {
            console.error('createFromPath', err);
        }
        file = {
            buffer,
            mimetype,
            originalname: filename
        };
        return this.create(file, key);
    }
    /**
     *  Create an s3 record from a stream
     *  Pass "createReadStream('')" object
     **/
    /*public async createStream (file : any) {
        if (!this.writeable) return false;
        const id : string = uuid();
        const ext : string = getExtension(file.mimetype);
        const key : string = `${id}.${ext}`;
        const webPath : string = pathJoin('/files/', this.bucket, key);
        const publicPath : string = pathJoin(`${this.bucket}.${this.endpoint}`, key);
        const record : FileRecord = {
            id,
            created : +new Date(),
            name : file.originalname,
            public : publicPath,
            path : webPath,
            path_hash : this.hash(webPath),
            hash : null,
            type : file.mimetype,
            size : null
        };
        const params : S3Params = {
            Bucket: this.bucket,
            Key: key
        };
        const upload = this.s3Stream.upload(params);

        upload.maxPartSize(20971520); // 20 MB
        upload.concurrentParts(5);

        return new Promise((resolve : Function, reject : Function) => {
            upload.on('error', (err : Error) => {
                return reject(err);
            });
            upload.on('part', (details : any) => {
                console.log(`${details.ETag} - part: ${details.PartNumber} received: ${details.receivedSize} uploaded: ${details.uploadedSize}`)
            });
            upload.on('uploaded', (details : any) => {
                record.hash = details.ETag;
                record.size = details.uploadedSize;
                console.log(`Saved file ${record.path}`);
                return resolve(record);
            });
            console.log(`Streaming ${record.path} to S3`);
            stream.pipe(upload);
        });
    }*/
    /**
     * Create a stream . Bind to busboy.on('file', files3.createStream)
     * ex. (express POST route callback)
     * var busboy = new Busboy({ headers: req.headers });
     * busboy.on('file', files3.createStream)
     * req.pipe(busboy);
     **/
    /* public async createStreamExpress (fieldname : string, file : any, filename : string, encoding : any, mimetype : string) {
         if (!this.writeable) return false;
         const id : string = uuid();
         const ext : string = getExtension(mimetype);
         const key : string = `${id}.${ext}`;
         const webPath : string = pathJoin('/files/', this.bucket, key);
         const publicPath : string = pathJoin(`${this.bucket}.${this.endpoint}`, key);
         const record : FileRecord = {
             id,
             created : +new Date(),
             name : filename,
             public : publicPath,
             path : webPath,
             path_hash : this.hash(webPath),
             hash : null,
             type : file.mimetype,
             size : null
         };
         const params : S3Params = {
             Bucket: this.bucket,
             Key: key
         };
         const upload = this.s3Stream.upload(params);
 
         upload.maxPartSize(20971520); // 20 MB
         upload.concurrentParts(5);
 
         return new Promise((resolve : Function, reject : Function) => {
             var s3 = new AWS.S3({
          params: {Bucket: 'sswa', Key: filename, Body: file},
          options: {partSize: 5 * 1024 * 1024, queueSize: 10}   // 5 MB
       });
       s3.upload().on('httpUploadProgress', function (evt) {
          console.log(evt);
       }).send(function (err, data) {
          s3UploadFinishTime = new Date();
          if(busboyFinishTime && s3UploadFinishTime) {
             res.json({
                uploadStartTime: uploadStartTime,
                busboyFinishTime: busboyFinishTime,
                s3UploadFinishTime: s3UploadFinishTime
             });
          }
          console.log(err, data);
       });
             file.on('data', ( data : any ) => {
                 upload.on('error', (err : Error) => {
                     return reject(err);
                 });
                 upload.on('part', (details : any) => {
                     console.log(`${details.ETag} - part: ${details.PartNumber} received: ${details.receivedSize} uploaded: ${details.uploadedSize}`)
                 });
                 upload.on('uploaded', (details : any) => {
                     record.hash = details.ETag;
                     record.size = details.uploadedSize;
                     console.log(`Saved file ${record.path}`)
                     return resolve(record)
                 });
                 data.pipe(upload);
             })
         });
     }*/
    /**
     * Create a stream from a path on the local device
     *
     * @param {string} filePath     Path to file
     * @param {string} keyName     (optional) Predefined key
     **/
    async createStreamFromPath(filePath, keyName) {
        if (!this.writeable)
            return false;
        const id = v4_1();
        const fileName = path_1.basename(filePath);
        const mimetype = mime_1.getType(filePath);
        const ext = mime_1.getExtension(fileName);
        const key = typeof keyName !== 'undefined' ? keyName : `${id}.${ext}`;
        const webPath = path_1.join('/files/', this.bucket, key);
        const publicPath = path_1.join(`${this.bucket}.${this.endpoint}`, key);
        const record = {
            id,
            created: +new Date(),
            name: fileName,
            public: publicPath,
            path: webPath,
            path_hash: this.hash(webPath),
            hash: null,
            type: mimetype,
            size: null
        };
        const params = {
            Bucket: this.bucket,
            Key: key
        };
        const upload = this.s3Stream.upload(params);
        const stream = fs_extra_1.createReadStream(filePath);
        upload.maxPartSize(20971520); // 20 MB
        upload.concurrentParts(5);
        return new Promise((resolve, reject) => {
            upload.on('error', (err) => {
                return reject(err);
            });
            upload.on('part', (details) => {
                console.log(`${details.ETag} - part: ${details.PartNumber} received: ${details.receivedSize} uploaded: ${details.uploadedSize}`);
            });
            upload.on('uploaded', (details) => {
                record.hash = details.ETag;
                record.size = details.uploadedSize;
                console.log(`Saved file ${record.path}`);
                return resolve(record);
            });
            console.log(`Streaming ${record.path} to S3`);
            stream.pipe(upload);
        });
    }
    /*private async optimizeJpeg (input : string) {
        let output;
        try {
            output = await sharp(input)
                .jpeg({
                    quality: 72,
                    chromaSubsampling: '4:4:4'
                })
                .toBuffer();
        } catch (err) {
            console.error(err)
            return input
        }
        return output
    }*/
    /**
     * Read a file from S3 using a key
     *
     * @param {string} key File key
     *
     * @returns {string} File data
     **/
    async read(key) {
        const params = {
            Bucket: this.bucket,
            Key: key
        };
        return new Promise((resolve, reject) => {
            return this.s3.getObject(params, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data.Body); //buffer
            });
        });
    }
    /*
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.setRequestHeader('x-amz-acl', 'public-read');
        xhr.send(file);
    */
    /**
     * Get a signed put key for writing
     *
     * @param {string} key          Key that file will be located at
     * @param {string} fileType     Mimetype of file
     *
     * @returns {string} Url of signed key
     **/
    async signedPutKey(key, fileType) {
        const s3Params = {
            Bucket: this.bucket,
            Key: key,
            ContentType: fileType,
            Expires: 86400 //1 day
            //ACL: 'public-read',
        };
        return new Promise((resolve, reject) => {
            return this.s3.getSignedUrl('putObject', s3Params, (err, url) => {
                if (err) {
                    return reject(err);
                }
                return resolve(url);
            });
        });
    }
    /**
     * Get a signed read key for writing
     *
     * @param {string} key          Key that file will be located at
     *
     * @returns {string} Url of signed key
     **/
    async signedGetKey(key) {
        const s3Params = {
            Bucket: this.bucket,
            Key: key,
            Expires: 86400 //1 day
            //ACL: 'public-read',
            //Expires: 60 ?
        };
        return new Promise((resolve, reject) => {
            return this.s3.getSignedUrl('getObject', s3Params, (err, url) => {
                if (err) {
                    return reject(err);
                }
                return resolve(url);
            });
        });
    }
    /*
    readStream (to express or server)
    s3.getObject(params)
    .on('httpHeaders', function (statusCode, headers) {
        res.set('Content-Length', headers['content-length']);
        res.set('Content-Type', headers['content-type']);
        this.response.httpResponse.createUnbufferedStream()
            .pipe(res);
    })
    .send();
--------
    var fileStream = fs.createWriteStream('/path/to/file.jpg');
    var s3Stream = s3.getObject({Bucket: 'myBucket', Key: 'myImageFile.jpg'}).createReadStream();

    // Listen for errors returned by the service
    s3Stream.on('error', function(err) {
        // NoSuchKey: The specified key does not exist
        console.error(err);
    });

    s3Stream.pipe(fileStream).on('error', function(err) {
        // capture any errors that occur when writing data to the file
        console.error('File Stream:', err);
    }).on('close', function() {
        console.log('Done.');
    });
    */
    /**
     * Delete an object at a specific key
     *
     * @param {string} key Key for object
     *
     * @returns {boolean} True if successful
     **/
    async delete(key) {
        if (!this.writeable)
            return false;
        const params = {
            Bucket: this.bucket,
            Key: key
        };
        return new Promise((resolve, reject) => {
            return this.s3.deleteObject(params, (err, data) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                return resolve(true); //buffer
            });
        });
    }
    /**
     * Lists all objects with a specific prefix
     **/
    async list(prefix) {
        const params = {
            Bucket: this.bucket,
            Prefix: prefix
        };
        return new Promise((resolve, reject) => {
            return this.s3.listObjectsV2(params, (err, data) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }
    async update() {
        if (!this.writeable)
            return false;
    }
}
module.exports.Files = Files;
//# sourceMappingURL=index.js.map