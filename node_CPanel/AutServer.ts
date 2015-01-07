/// <reference path="FileManager.ts" />
import http = require('http');
import fs = require("fs");
import crypto = require('crypto');
import path = require("path");
import FM = require('./FileManager');

export class AutServer {
    private https = require('https');
    private path = require("path");
    private url = require('url');
    private qs = require('querystring');
    private error: number;
    private options = {
        key: fs.readFileSync('data/server.key'),
        cert: fs.readFileSync('data/server.crt')
    };
    private SESS = 'SESSIONID';
    private sessions = {};
    private PUB_DIR = 'pub';
    private sqlite3 = require('sqlite3').verbose();
    private db

    private fileManager: FM.FileManager = new FM.FileManager();

    private generate_key() {
        var sha = crypto.createHash('sha256');
        sha.update(Math.random().toString());
        return sha.digest('hex');
    }

    private getSessionUser(cookie: string): string {
        if (!cookie) return null;
        var l = this.SESS.length;
        var id = cookie.substr(l + 1).trim();
        //	console.log('session id; '+id);
        return this.sessions[id];
    }
    private setSessionUser(resp: http.ServerResponse) {
        var id: string = this.generate_key();
        var user: any = {};
        user.sid = id;
        this.sessions[id] = user;
        resp.setHeader("Set-Cookie: sessionid", id + '; Path=/');
        return user;
    }


    private sendJson = function (res: http.ServerResponse, data: any) {
        res.setHeader("Content-Type", 'application/json');
        res.end(JSON.stringify(data));
    }

    private sendError = function (res: http.ServerResponse, reason: string) {
        res.end(reason);
    }
    private sendFile(filename: string, res: http.ServerResponse) {
        filename = this.PUB_DIR + filename;

        var contentTypesByExtension = {
            '.html': "text/html",
            '.css': "text/css",
            '.js': "text/javascript"
        };
        var sendError = function (res, err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain");
            res.write(err + "\n");
            res.end();
        }

		var sendNotFound = function (res) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.write("404 Not Found\n");
            res.end();
        }


		var _sendFile = function (res, data, type) {
            res.statusCode = 200;
            if (type) res.setHeader("Content-Type", type);
            res.write(data, "binary");
            res.end();
        }

		this.path.exists(filename, function (exists) {
            if (!exists || fs.statSync(filename).isDirectory()) sendNotFound(res);
            else {
                fs.readFile(filename, "binary", function (err, file) {
                    if (err) sendError(res, err);
                    else _sendFile(res, file, contentTypesByExtension[path.extname(filename)]);
                });
            }
        });

    }


    private processGetQuery(url: string, q: number, res: http.ServerResponse): void {
        var func: string[] = url.substr(1, q - 1).split('/');
        var args: string[] = url.substr(q + 1).split(',');
        switch (func.shift()) {
            case 'fileM':
                this.fileManager.processRequest(func, args, (data) => this.sendJson(res, data));
                break;

        }
    }

    private processGet(req: http.ServerRequest, res: http.ServerResponse, user: any) {       
        var url = decodeURI(req.url);
       // console.log(url);
        var q = url.indexOf('?');
        if (q === -1) this.sendFile(url, res);
        else this.processGetQuery(url, q, res);        
        /*
          if (user && user.role && user.role.indexOf('user') != -1) this.sendFile(u.pathname, res);
          else this.sendFile('/login.html', res);
          */
        //else res.end('Please login to processGet');
    }

    private getPostData(req: http.ServerRequest, res: http.ServerResponse, user: any) {
        var body = '';
        var _this = this;
        req.on('data', function (data) {
            body += data;
            if (body.length > 1e6) req.connection.destroy();
        });
        req.on('end', function () {
            _this.processPost(req, res, user, _this.qs.parse(body));
        });

    }


    private processPost(req: http.ServerRequest, res: http.ServerResponse, user: any, data: any) {
        if (!data) data = {};
        var u: string = req.url
        console.log('procesPost user role:', user.role);
        switch (u.substr(0, 5)) {
            case '/cmd/':
                //if (user && user.role.indexOf('cmd') != -1 && data.cmd) this.sendCommand(data.cmd, res);
                //else this.sendError(res, 'Command error user: ' + user + ' role: ' + (user ? user.role : 'none') + '  cmd: ' + data.cmd);
                break;
            case '/logi':
                this.processLogin(req, res, user, data);			
			break
			case '/logu':
                this.killUserSession(user, data);
                break;

            default:
                this.sendError(res, 'ERROR: ' + u.substr(0, 5) + ' not implemented');
			break
		}


    }

    private saveUserData(user, data) {
        //TODO saveuser session in DB
        console.log('saveUserData user ', user);
        console.log('saveUserData data ', data);
    }

    private killUserSession(user: any, data: any) {
        var sid = user.sid;
        delete this.sessions[sid];
        if (data) this.saveUserData(user, data);
    }
    private setUserInSession = function (sid, user) {
        var u = this.sessions[sid];
        //console.log(' setUserInSession  user  fo session: '+sid,u);
        for (var str in user) u[str] = user[str];
        this.sessions[sid] = u;
    }

    private processLogin(req, res, suser, data) {
        var _this = this;

        var onLogin = function (user) {
            if (user) {
                _this.setUserInSession(suser.sid, user);
                _this.sendJson(res, { profile: user.profile, sid: suser.sid });
            } else _this.sendJson(res, { result: 'wrong login' });
        }

    this.loginFunction(data.user, data.pass, onLogin);
    }

    private loginFunction = function (user: string, pass: string, callBack: Function) {

        if (!this.db) this.db = new this.sqlite3.Database('data/directories.db');

        var stmt = this.db.all('SELECT * FROM users WHERE username=? AND password=?', [user, pass], function (err, rows) {
            if (err) {
                console.log(err);
                callBack(0);
            } else if (rows.length === 0) {
                callBack(0);
            } else {
                var user = rows[0];
                callBack(user);
            }

        });
    }

    constructor() {


    }

    close(): void {
        this.server.close();
    }

    private isSecure: boolean;
    private server:any
    createServer(secure, port= 443) {
        this.isSecure = secure;
        var _this = this;
       var server =  this.https.createServer(this.options, function (req: http.ServerRequest, resp: http.ServerResponse) {
            _this.error = 0;
            var user;
            if (!_this.isSecure) user = { role: 'user' };
            else user = _this.getSessionUser(req.headers.cookie);

            if (!user) {
                user = _this.setSessionUser(resp);
                _this.sendFile('/login.html', resp);
                return;
            }

            if (req.method == 'GET') _this.processGet(req, resp, user);
            else if (req.method == 'POST') _this.getPostData(req, resp, user);

       }).listen(port, function () { console.log('Server started on port: ' + server.address().port);  });

        this.server = server;
    }



}
