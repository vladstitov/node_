var child = require('child_process');

var error = 0;

var INSTALL_FOLDER = 'myapp';

var GITURL = 'https://github.com/vladvaldtitov/node_CPanel.git';

//var APP_FOLDER: string = INSTALL_FOLDER + '/node_CPanel';
var APP_FOLDER = INSTALL_FOLDER + '';

var settings = {
    INSTALL_FOLDER: INSTALL_FOLDER,
    GITURL: GITURL,
    APP_FOLDER: APP_FOLDER,
    CHECK_TIMER: 20000,
    isProd: 0
};

var gitCtr;
var server;

var onGitReady = function () {
    console.log('onGitReady');
    if (!server) {
        server = new AppCommander(child, settings);
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
    // gitCtr.runClone();
    // gitCtr.runInstall();
    gitCtr.runFetch();
};
var onAppTaskComlete = function (mode, code) {
};

var onGitTaskComlete = function (mode, code) {
    switch (mode) {
        case 'clone':
            gitCtr.runInstall();
            break;
        case 'install':
            gitCtr.startTimer();
            break;
        case 'newdata':
            break;
    }
};

function initMe(child) {
    error = 0;
    gitCtr = new GitCommander(child, settings);

    // gitCtr.onReady = onGitReady;
    // gitCtr.onNewData = onHaveUpdate;
    gitCtr.onComplete = onGitTaskComlete;
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
        // console.log(chunk);
    });
}

var GitCommander = (function () {
    function GitCommander(child, settings) {
        this.child = child;
        this.CHECK_TIMER = 200000;
        // private settings;
        this.inProcess = 0;
        this.pc = 0;
        this.fs = require('fs');
        this.onData = function (err, stdout, stdin) {
            console.log('err: ', err);
            console.log('out :', stdout);
            console.log('stdin: ', stdin);
        };
        this.exec = child.exec;
        for (var str in settings)
            this[str] = settings[str];
    }
    GitCommander.prototype.doCommand = function (cmd, callBack, onClose) {
        var pc = this.exec(cmd, null, callBack);
        pc.on('close', function (code) {
            return onClose(code);
        });
        return pc;
    };

    GitCommander.prototype.sendError = function (err) {
        err = '\n ' + new Date() + "\n " + err;
        this.fs.appendFile('err.txt', err, 'utf8', function (err) {
            if (err)
                throw err;
        });
        // console.log('ERROR : ' + new Date() + "\n" + err);
    };
    GitCommander.prototype.sendLog = function (log) {
        log = '\n ' + new Date() + "\n " + log;
        this.fs.appendFile('log.txt', log, 'utf8', function (err) {
            if (err)
                throw err;
        });
        // console.log('ERROR : ' + new Date() + "\n" + err);
    };

    ///////////////////////////////////////////////////////////
    GitCommander.prototype.haveNewData = function () {
        if (this.onNewData)
            this.onNewData();
    };

    GitCommander.prototype.startTimer = function () {
        var _this = this;
        console.log('Starting timer ' + this.CHECK_TIMER);
        this.fetchTimer = setInterval(function () {
            return _this.runFetch();
        }, this.CHECK_TIMER);
    };

    GitCommander.prototype.stopTimer = function () {
        clearInterval(this.fetchTimer);
    };

    GitCommander.prototype.onComplete = function (mode, code) {
    };

    GitCommander.prototype.reset = function () {
        this.pc = 0;
        this.inProcess = 0;
        return 0;
    };

    GitCommander.prototype.runFetch = function () {
        var _this = this;
        var mode = 'fetch';
        var cmd = 'git fetch ';
        var f = function (err, stdout, stdin) {
            return _this.onData(err, stdout, stdin);
        };
        if (this.isProd)
            f = null;
        else
            console.log(' Running: ' + cmd);
        this.pc = this.doCommand(cmd, f, function (code) {
            return _this.onCommandDone(code, mode);
        });
    };

    GitCommander.prototype.runInstall = function () {
        var _this = this;
        var mode = 'install';
        var cmd = 'cd ' + this.INSTALL_FOLDER + ' && ' + ' npm install';
        var f = function (err, stdout, stdin) {
            return _this.onData(err, stdout, stdin);
        };
        if (this.isProd)
            f = null;
        else
            console.log(' Running: ' + cmd);

        this.pc = this.doCommand(cmd, f, function (code) {
            return _this.onCommandDone(code, mode);
        });
    };

    GitCommander.prototype.runPull = function () {
        var _this = this;
        var mode = 'pull';
        var f = function (err, stdout, stdin) {
            return _this.onData(err, stdout, stdin);
        };
        if (this.isProd)
            f = null;
        var cmd = 'cd ' + this.INSTALL_FOLDER + ' && ' + ' git pull';
        this.pc = this.doCommand(cmd, f, function (code) {
            return _this.onCommandDone(code, mode);
        });
    };

    GitCommander.prototype.onCommandDone = function (code, mode) {
        console.log('Mode ' + mode + ' finished with code: ' + code);

        this.onComplete(mode, code);
    };

    GitCommander.prototype.runClone = function () {
        var _this = this;
        var mode = 'clone';
        var cmd = 'git clone ' + this.GITURL + ' ' + this.INSTALL_FOLDER + ' --depth 1';
        var f = function (err, stdout, stdin) {
            return _this.onData(err, stdout, stdin);
        };
        if (this.isProd)
            f = null;
        else
            console.log(' Running: ' + cmd);
        this.pc = this.doCommand(cmd, f, function (code) {
            return _this.onCommandDone(code, mode);
        });
    };
    return GitCommander;
})();

var AppCommander = (function () {
    function AppCommander(child, settings) {
        this.settings = settings;
        this.exec = child.exec;
        this.PREF = settings.PREF;
    }
    AppCommander.prototype.processData = function (data) {
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

    AppCommander.prototype.onDataFromServer = function (data) {
        console.log('onDataFromServer: ' + data);
        if (data && data.indexOf('FROM') == 0)
            this.processData(data);
    };

    AppCommander.prototype.onDataClose = function (data) {
        console.log('onDataClose: ' + data);
    };
    AppCommander.prototype.onDataError = function (data) {
        console.log('onDataError: ' + data);
    };

    AppCommander.prototype.sendTest = function () {
        this.pc.stdin.write("hello\n");
    };

    AppCommander.prototype.startApplication = function () {
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

    AppCommander.prototype.stopApplication = function () {
        console.log('sending stop server ');
        this.pc.stdin.write("stopapplication\n");
    };
    return AppCommander;
})();

initMe(child);
//# sourceMappingURL=app.js.map
