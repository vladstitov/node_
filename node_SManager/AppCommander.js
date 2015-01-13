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
exports.AppCommander = AppCommander;
//# sourceMappingURL=AppCommander.js.map
