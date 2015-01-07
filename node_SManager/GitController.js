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
exports.GitController = GitController;
//# sourceMappingURL=GitController.js.map
