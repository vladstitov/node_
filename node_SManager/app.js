var child = require('child_process');
var error = 0;

var FOLDER = 'myserver';

//var GITURL: string = 'https://github.com/vladvaldtitov/SimpleServer.git';
var GITURL = 'https://github.com/vladvaldtitov/node_CPanel.git';

var settings = {
    FOLDER: FOLDER,
    GITURL: GITURL,
    server: 'app.js',
    PREF: 'cd ' + FOLDER + ' && ',
    clone: { cmd: 'cd .. & git clone ' + GITURL + ' ' + FOLDER },
    pull: { cmd: 'git pull' },
    install: { cmd: 'npm install' },
    fetch: { cmd: 'git fetch' }
};

////////////////////////////////////////////////////////////////////////////////////
var gitCtr;
var server;

var onGitReady = function () {
    console.log('onGitReady');
    if (!server) {
        server = new AC.AppController(child, settings);
        server.onServerStoped = onServerStoped;
    }
    gitCtr.startTimer();
    server.startApplication();
};
var onServerStoped = function () {
    console.log('server stoped ready for update');
    gitCtr.runPull();
};
var stopServer = function () {
    server.stopApplication();
};

var onHaveUpdate = function () {
    gitCtr.stopTimer();
    stopServer();
};

var startClone = function () {
    gitCtr.runClone();
};

function initMe(child) {
    error = 0;
    gitCtr = new GC.GitController(child, settings);
    gitCtr.onReady = onGitReady;
    gitCtr.onNewData = onHaveUpdate;

    setTimeout(startClone, 1000);
    var exec = child.exec;
    process.stdin.setEncoding('utf8');
    process.on('uncaughtException', function (err) {
        error = err.stack;
        console.error('An uncaught error occurred!', err.stack);
    });

    var onData = function (err, stdout, stdin) {
        console.log('err: ', err);
        console.log('out :', stdout);
        console.log('stdin: ', stdin);
    };

    process.stdin.on('readable', function () {
        var chunk = process.stdin.read();
        if (!chunk)
            return;
        if (chunk.trim() == 'stop') {
            stopServer();
            return;
        }
        if (!gitCtr.sendCommand(chunk.trim()))
            exec(chunk, null, onData);
        // console.log(chunk);
    });
}

var AC;
(function (AC) {
    var AppController = (function () {
        function AppController(child, settings) {
            this.settings = settings;
            this.exec = child.exec;
            this.PREF = settings.PREF;
        }
        AppController.prototype.processData = function (data) {
            data = data.trim();
            switch (data) {
                case 'FROM_APP_STOPPED':
                    this.pc.stdin.write("exitprocess\n");
                    this.pc.kill();
                    this.pc = null;
                    if (this.onServerStoped)
                        this.onServerStoped();
                    break;
                case 'FROM_APPLICATION_HELLO':
                    this.isHello = true;
                    break;
            }
        };

        AppController.prototype.onDataFromServer = function (data) {
            console.log('onDataFromServer: ' + data);
            if (data && data.indexOf('FROM') == 0)
                this.processData(data);
        };

        AppController.prototype.onDataClose = function (data) {
            console.log('onDataClose: ' + data);
        };
        AppController.prototype.onDataError = function (data) {
            console.log('onDataError: ' + data);
        };

        AppController.prototype.sendTest = function () {
            this.pc.stdin.write("hello\n");
        };

        AppController.prototype.startApplication = function () {
            var _this = this;
            this.pc = this.exec(this.PREF + 'npm start', function (error, stdout, stderr) {
                console.log('on process end stdout: ' + stdout);
                console.log('on process end stderr: ' + stderr);
                console.log('on process end error: ' + error);
            }); //, null, (err, stdout, stdin) => this.onData(err, stdout, stdin));

            this.pc.on('close', function (code) {
                return _this.onDataClose(code);
            });
            this.pc.stdout.on('data', function (data) {
                return _this.onDataFromServer(data);
            });
            this.pc.stderr.on('data', function (data) {
                return _this.onDataError(data);
            });
            setTimeout(function () {
                return _this.sendTest();
            }, 1000);
        };

        AppController.prototype.stopApplication = function () {
            console.log('sending stop server ');
            this.pc.stdin.write("stopapplication\n");
        };
        return AppController;
    })();
    AC.AppController = AppController;
})(AC || (AC = {}));

var GC;
(function (GC) {
    var GitController = (function () {
        function GitController(child, settings) {
            this.child = child;
            this.inProcess = 0;
            this.pc = 0;
            this.fs = require('fs');
            this.pullF = function (cmd) {
                console.log('pullF:   ' + cmd);
                var res = '';
                var _this = this;
                var onData = function (err, stdout, stdin) {
                    res += err + stdout + stdin;
                };
                var onClose = function (code) {
                    _this.onPullComplete(res, code);
                };
                return this.doCommand(cmd, onData, onClose);
            };
            this.exec = child.exec;
            this.settings = settings;
            this.PREF = settings.PREF;
        }
        GitController.prototype.callBackTest = function (err, stdout, stdin) {
            console.log('callBack  ', this);
            console.log('err: ', err);
            console.log('out :', stdout);
            console.log('stdin: ', stdin);
        };

        GitController.prototype.doCommand = function (cmd, callBack, onClose) {
            var pc = this.exec(cmd, null, function (err, stdout, stdin) {
                return callBack(err, stdout, stdin);
            });
            pc.on('close', function (code) {
                return onClose(code);
            });
            return pc;
        };

        GitController.prototype.sendError = function (err) {
            err = '\n ' + new Date() + "\n " + err;
            this.fs.appendFile('err.txt', err, 'utf8', function (err) {
                if (err)
                    throw err;
            });
            // console.log('ERROR : ' + new Date() + "\n" + err);
        };
        GitController.prototype.sendLog = function (log) {
            log = '\n ' + new Date() + "\n " + log;
            this.fs.appendFile('log.txt', log, 'utf8', function (err) {
                if (err)
                    throw err;
            });
            // console.log('ERROR : ' + new Date() + "\n" + err);
        };

        GitController.prototype.pullFromGit = function () {
            this.sendCommand('pull');
        };

        //////////////////////////////////////CLONE//////////////////////////////////////
        GitController.prototype.onCloneComplete = function (res, code) {
            this.reset();
            console.log('onCloneComplete : ' + code, res);

            this.pullFromGit();
        };
        GitController.prototype.cloneF = function (cmd) {
            console.log('cloneF:   ' + cmd);
            var res = '';
            var _this = this;
            var onData = function (err, stdout, stdin) {
                res += err + stdout + stdin;
            };
            var onClose = function (code) {
                _this.onCloneComplete(res, code);
            };
            return this.doCommand(cmd, onData, onClose);
        };

        ///////////////////////////////////INSTALL/////////////////////////////////////////
        GitController.prototype.onIstallComplete = function (res, code) {
            console.log('onIstallComplete : ' + code, res);
            this.reset();
            if (code)
                this.sendError(res);

            if (this.onReady)
                this.onReady();
        };

        GitController.prototype.installF = function (cmd) {
            console.log('installF:   ' + cmd);
            var res = '';
            var _this = this;
            var onData = function (err, stdout, stdin) {
                res += err + stdout + stdin;
            };
            var onClose = function (code) {
                _this.onIstallComplete(res, code);
            };
            return this.doCommand(cmd, onData, onClose);
        };

        ///////////////////////////////////////////////////////////
        GitController.prototype.haveNewData = function () {
            if (this.onNewData)
                this.onNewData();
        };

        //////////////////////////////////////FETCH//////////////////////////////////////////////////////////
        GitController.prototype.onFetchComplete = function (res, code) {
            console.log('onFetchComplete : ' + code, res);
            this.reset();
            if (code)
                this.sendError(res);
            if (res.length > 100)
                this.haveNewData();
        };

        GitController.prototype.fetchF = function (cmd) {
            console.log('fetchF:   ' + cmd);
            var res = '';
            var _this = this;
            var onData = function (err, stdout, stdin) {
                res += err + stdout + stdin;
            };
            var onClose = function (code) {
                _this.onFetchComplete(res, code);
            };
            return this.doCommand(cmd, onData, onClose);
        };

        GitController.prototype.runInstall = function () {
            this.sendCommand('install');
        };

        //////////////////////////////////////////////////////PULL////////////////////////////////////
        GitController.prototype.onPullComplete = function (res, code) {
            console.log('onPullComplete : ' + code, res);
            this.reset();
            if (code)
                this.sendError(res);
            this.runInstall();
        };

        /////////////////////////////////////////////////////////////////////////////////////////////////
        GitController.prototype.checkForUpdates = function () {
            return this.sendCommand('fetch');
        };

        GitController.prototype.startTimer = function () {
            var _this = this;
            this.fetchTimer = setInterval(function () {
                return _this.checkForUpdates();
            }, 200000);
        };

        GitController.prototype.stopTimer = function () {
            clearInterval(this.fetchTimer);
        };

        GitController.prototype.reset = function () {
            this.pc = 0;
            this.inProcess = 0;
            return 0;
        };

        GitController.prototype.runPull = function () {
            this.sendCommand('pull');
        };

        GitController.prototype.runClone = function () {
            this.sendCommand('clone');
        };

        GitController.prototype.sendCommand = function (chunk) {
            var cmd = this.settings[chunk];
            if (!cmd)
                return false;
            if (this.pc)
                return false;
            this.inProcess = chunk;
            var fun = this[this.inProcess + 'F'];
            if (typeof fun !== 'function')
                return this.reset();
            this.pc = fun.call(this, this.PREF + cmd.cmd);

            // this.pc = this.exec(this.PREF + cmd.cmd, null, (err, stdout, stdin) => callback(err, stdout, stdin));
            // this.pc.on('close',(code)=> this.onClose(code));
            // console.log(_this.onClose);
            return this.pc;
        };
        return GitController;
    })();
    GC.GitController = GitController;
})(GC || (GC = {}));

initMe(child);
//# sourceMappingURL=app.js.map
