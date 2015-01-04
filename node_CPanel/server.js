//import request = require('request');
//http = require('http'),
var path = require("path");
var fs = require("fs");

//import sys = require('sys');
var crypto = require('crypto');

var port = process.env.port || 1337;

var FileManager = (function () {
    function FileManager() {
        this.fs = fs;
    }
    FileManager.prototype.onDirFiles = function (dir, err, files, callBack) {
        var i = 0;
        var n = files.length;
        var fs = this.fs;
        var filename;
        var out = [];

        var mask = 2;
        var onStat = function (er, stat) {
            if (er)
                stat = er;
            stat.filename = filename;

            //stat.perm = parseInt(stat.mode.toString(8), 10);
            out.push(stat);
            i++;
            if (i < n)
                getNextStatus(files[i]);
            else
                callBack(out);
        };

        var getNextStatus = function (name) {
            //  console.log('getting stat of: ' + name);
            filename = name;
            fs.stat(dir + '/' + name, onStat);
        };

        getNextStatus(files[0]);
    };

    FileManager.prototype.processRequest = function (func, args, callBack) {
        this._callBack = callBack;
        var f;
        if (func.length == 1) {
            f = this[func[0]];

            // console.log('processRequest of 1 ' + func, f);
            args.push(callBack);
            if (typeof f === 'function')
                f.apply(this, args);
            else
                callBack({ error: 'no function ' + func[0] + ' in FileManager' });
        } else if (func.length == 2) {
            var result = function (err, data) {
                callBack(data);
            };
            args.push(result);
            var obj = this[func[0]];
            var f = obj[func[1]];

            //  console.log('processRequest of 2 ' + func[0] + ' 1: ' + func[1], f);
            //  console.log('processRequest arguments: ', args.push(result));
            if (typeof f === 'function')
                f.apply(this, args);
            else
                callBack({ error: 'Cant find function of: ' + func[0] + '.' + func[1] });
        } else
            callBack({ error: 'processRequest function lenfth not 1 or 2 ' + func });
    };

    FileManager.prototype.getDirStats = function (path, callBack) {
        var _this = this;
        // var callBack:Function = this._callBack;
        this.fs.readdir(path, function (err, files) {
            return _this.onDirFiles(path, err, files, callBack);
        });
    };
    return FileManager;
})();

var Server = (function () {
    function Server() {
        this.https = require('https');
        this.path = require("path");
        this.url = require('url');
        this.qs = require('querystring');
        this.options = {
            key: fs.readFileSync('data/server.key'),
            cert: fs.readFileSync('data/server.crt')
        };
        this.SESS = 'SESSIONID';
        this.sessions = {};
        this.PUB_DIR = 'pub';
        this.sqlite3 = require('sqlite3').verbose();
        this.fileManager = new FileManager();
        this.sendJson = function (res, data) {
            res.setHeader("Content-Type", 'application/json');
            res.end(JSON.stringify(data));
        };
        this.sendError = function (res, reason) {
            res.end(reason);
        };
        this.setUserInSession = function (sid, user) {
            var u = this.sessions[sid];

            for (var str in user)
                u[str] = user[str];
            this.sessions[sid] = u;
        };
        this.loginFunction = function (user, pass, callBack) {
            if (!this.db)
                this.db = new this.sqlite3.Database('data/directories.db');

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
        };
    }
    Server.prototype.generate_key = function () {
        var sha = crypto.createHash('sha256');
        sha.update(Math.random().toString());
        return sha.digest('hex');
    };

    Server.prototype.getSessionUser = function (cookie) {
        if (!cookie)
            return null;
        var l = this.SESS.length;
        var id = cookie.substr(l + 1).trim();

        //	console.log('session id; '+id);
        return this.sessions[id];
    };
    Server.prototype.setSessionUser = function (resp) {
        var id = this.generate_key();
        var user = {};
        user.sid = id;
        this.sessions[id] = user;
        resp.setHeader("Set-Cookie: sessionid", id + '; Path=/');
        return user;
    };

    Server.prototype.sendFile = function (filename, res) {
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
        };

        var sendNotFound = function (res) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.write("404 Not Found\n");
            res.end();
        };

        var _sendFile = function (res, data, type) {
            res.statusCode = 200;
            if (type)
                res.setHeader("Content-Type", type);
            res.write(data, "binary");
            res.end();
        };

        this.path.exists(filename, function (exists) {
            if (!exists || fs.statSync(filename).isDirectory())
                sendNotFound(res);
            else {
                fs.readFile(filename, "binary", function (err, file) {
                    if (err)
                        sendError(res, err);
                    else
                        _sendFile(res, file, contentTypesByExtension[path.extname(filename)]);
                });
            }
        });
    };

    Server.prototype.processGet = function (req, res, user) {
        var _this = this;
        // var u = this.url.parse(req.url, true);
        var url = req.url;
        console.log(url);
        var q = url.indexOf('?');
        if (q === -1)
            this.sendFile(url, res);
        else {
            var func = url.substr(1, q - 1).split('/');
            var args = url.substr(q + 1).split(',');

            switch (func.shift()) {
                case 'fileM':
                    this.fileManager.processRequest(func, args, function (data) {
                        return _this.sendJson(res, data);
                    });
                    break;
            }
        }
        /*
        if (user && user.role && user.role.indexOf('user') != -1) this.sendFile(u.pathname, res);
        else this.sendFile('/login.html', res);
        */
        //else res.end('Please login to processGet');
    };

    Server.prototype.getPostData = function (req, res, user) {
        var body = '';
        var _this = this;
        req.on('data', function (data) {
            body += data;
            if (body.length > 1e6)
                req.connection.destroy();
        });
        req.on('end', function () {
            _this.processPost(req, res, user, _this.qs.parse(body));
        });
    };

    Server.prototype.processPost = function (req, res, user, data) {
        if (!data)
            data = {};
        var u = req.url;
        console.log('procesPost user role:', user.role);
        switch (u.substr(0, 5)) {
            case '/cmd/':
                break;
            case '/logi':
                this.processLogin(req, res, user, data);
                break;
            case '/logu':
                this.killUserSession(user, data);
                break;

            default:
                this.sendError(res, 'ERROR: ' + u.substr(0, 5) + ' not implemented');
                break;
        }
    };

    Server.prototype.saveUserData = function (user, data) {
        //TODO saveuser session in DB
        console.log('saveUserData user ', user);
        console.log('saveUserData data ', data);
    };

    Server.prototype.killUserSession = function (user, data) {
        var sid = user.sid;
        delete this.sessions[sid];
        if (data)
            this.saveUserData(user, data);
    };

    Server.prototype.processLogin = function (req, res, suser, data) {
        var _this = this;

        var onLogin = function (user) {
            if (user) {
                _this.setUserInSession(suser.sid, user);
                _this.sendJson(res, { profile: user.profile, sid: suser.sid });
            } else
                _this.sendJson(res, { result: 'wrong login' });
        };

        this.loginFunction(data.user, data.pass, onLogin);
    };

    Server.prototype.createServer = function (secure, port) {
        if (typeof port === "undefined") { port = 443; }
        this.isSecure = secure;
        var _this = this;
        this.https.createServer(this.options, function (req, resp) {
            _this.error = 0;
            var user;
            if (!_this.isSecure)
                user = { role: 'user' };
            else
                user = _this.getSessionUser(req.headers.cookie);

            if (!user) {
                user = _this.setSessionUser(resp);
                _this.sendFile('/login.html', resp);
                return;
            }

            if (req.method == 'GET')
                _this.processGet(req, resp, user);
            else if (req.method == 'POST')
                _this.getPostData(req, resp, user);
        }).listen(port);
    };
    return Server;
})();

var server = new Server();
server.createServer(false);
/*
http.createServer(function (req, res) {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('Hello World\n');
}).listen(port);
*/
//# sourceMappingURL=server.js.map
