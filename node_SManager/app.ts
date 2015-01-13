var child = require('child_process');
var error: number = 0;


var FOLDER: string = 'myserver';
//var GITURL: string = 'https://github.com/vladvaldtitov/SimpleServer.git';
var GITURL: string = 'https://github.com/vladvaldtitov/node_CPanel.git';

var settings = {
    FOLDER: FOLDER,
    GITURL: GITURL,
    server: 'app.js',
    PREF: 'cd ' + FOLDER + ' && ',
    clone: { cmd: 'cd .. & git clone ' + GITURL + ' ' + FOLDER },
    pull: { cmd: 'git pull' },
    install: { cmd: 'npm install' },
    fetch: { cmd: 'git fetch' }
}
////////////////////////////////////////////////////////////////////////////////////


var gitCtr:GC.GitController
var server: AC.AppController;


var onGitReady = function () {
    console.log('onGitReady');
    if (!server) {
        server = new AC.AppController(child, settings);
        server.onServerStoped = onServerStoped;
    }
    gitCtr.startTimer();
    server.startApplication();
    
}
var onServerStoped = function () {
    console.log('server stoped ready for update');
    gitCtr.runPull();
}
var stopServer = function () {
    server.stopApplication();
}

var onHaveUpdate = function () {
    gitCtr.stopTimer();
    stopServer();
}

var startClone = function(){
    gitCtr.runClone();
}


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
    }


    process.stdin.on('readable', function () {
        var chunk = process.stdin.read();
        if (!chunk) return;
        if (chunk.trim() == 'stop') {
            stopServer();
            return;
        }
        if (!gitCtr.sendCommand(chunk.trim())) exec(chunk, null, onData);
        // console.log(chunk);  
    }
        );
}

module AC {
    export class AppController {
    private exec
    private pc: any;
        private PREF: string;   

    private isHello: boolean
    private processData(data: string): void {
            data = data.trim();
            switch (data) {
                case 'FROM_APP_STOPPED':
                    this.pc.stdin.write("exitprocess\n");
                    this.pc.kill();
                    this.pc = null;
                    if (this.onServerStoped) this.onServerStoped();
                    break;
                case 'FROM_APPLICATION_HELLO':
                    this.isHello = true;
                    break;

            }
        }


        private onDataFromServer(data: string): void {
            console.log('onDataFromServer: ' + data);
            if (data && data.indexOf('FROM') == 0) this.processData(data);
        }

        private onDataClose(data: string): void {
            console.log('onDataClose: ' + data);
        }
        private onDataError(data: string): void {
            console.log('onDataError: ' + data);
        }

        private sendTest(): void {
            this.pc.stdin.write("hello\n");
        }
        constructor(child, private settings: any) {
            this.exec = child.exec;
            this.PREF = settings.PREF;
        }


        onServerStoped: Function;
        startApplication() {
            this.pc = this.exec(this.PREF + 'npm start', function (error, stdout, stderr) {
                console.log('on process end stdout: ' + stdout);
                console.log('on process end stderr: ' + stderr);
                console.log('on process end error: ' + error);

            });//, null, (err, stdout, stdin) => this.onData(err, stdout, stdin));

            this.pc.on('close', (code) => this.onDataClose(code));
            this.pc.stdout.on('data', (data) => this.onDataFromServer(data));
            this.pc.stderr.on('data', (data) => this.onDataError(data));
            setTimeout(() => this.sendTest(), 1000);
        }

        stopApplication() {
            console.log('sending stop server ');
            this.pc.stdin.write("stopapplication\n");
        }

    }
}

module GC {
    export class GitController {
        private PREF;
        private settings;
        private inProcess = 0;
        private pc: any = 0;
        private exec;
        private fetchTimer;
        private fs = require('fs');

        private callBackTest(err, stdout, stdin) {
            console.log('callBack  ', this);
            console.log('err: ', err);
            console.log('out :', stdout);
            console.log('stdin: ', stdin);
        }

        private doCommand(cmd: string, callBack: Function, onClose: Function): void {
            var pc = this.exec(cmd, null, (err, stdout, stdin) => callBack(err, stdout, stdin));
            pc.on('close', (code) => onClose(code));
            return pc;
        }

        private sendError(err) {
            err = '\n ' + new Date() + "\n " + err;
            this.fs.appendFile('err.txt', err, 'utf8', function (err) {
                if (err) throw err;
            });
            // console.log('ERROR : ' + new Date() + "\n" + err);

        }
        private sendLog(log) {
            log = '\n ' + new Date() + "\n " + log;
            this.fs.appendFile('log.txt', log, 'utf8', function (err) {
                if (err) throw err;
            });
            // console.log('ERROR : ' + new Date() + "\n" + err);

        }

        private pullFromGit() {
            this.sendCommand('pull');
        }

        //////////////////////////////////////CLONE//////////////////////////////////////
        onCloneComplete(res, code): void {
            this.reset();
            console.log('onCloneComplete : ' + code, res);

            this.pullFromGit();
        }
        private cloneF(cmd) {
            console.log('cloneF:   ' + cmd);
            var res = '';
            var _this = this;
            var onData = function (err, stdout, stdin) {
                res += err + stdout + stdin;
            }
        var onClose = function (code) { _this.onCloneComplete(res, code); }
       return this.doCommand(cmd, onData, onClose);

        }
        ///////////////////////////////////INSTALL/////////////////////////////////////////

        onIstallComplete(res, code): void {
            console.log('onIstallComplete : ' + code, res);
            this.reset();
            if (code) this.sendError(res);

            if (this.onReady) this.onReady();
        }

        private installF(cmd) {
            console.log('installF:   ' + cmd);
            var res = '';
            var _this = this;
            var onData = function (err, stdout, stdin) {
                res += err + stdout + stdin;
            }
        var onClose = function (code) { _this.onIstallComplete(res, code); }
       return this.doCommand(cmd, onData, onClose);
        }
        ///////////////////////////////////////////////////////////
        private haveNewData(): void {
            if (this.onNewData) this.onNewData();
        }
        //////////////////////////////////////FETCH//////////////////////////////////////////////////////////
        onFetchComplete(res, code): void {
            console.log('onFetchComplete : ' + code, res);
            this.reset();
            if (code) this.sendError(res);
            if (res.length > 100) this.haveNewData();
        }

        private fetchF(cmd) {
            console.log('fetchF:   ' + cmd);
            var res = '';
            var _this = this;
            var onData = function (err, stdout, stdin) {
                res += err + stdout + stdin;
            }
        var onClose = function (code) { _this.onFetchComplete(res, code); }
       return this.doCommand(cmd, onData, onClose);
        }

        private runInstall(): void {
            this.sendCommand('install');
        }
        //////////////////////////////////////////////////////PULL//////////////////////////////////// 
        onPullComplete(res, code): void {
            console.log('onPullComplete : ' + code, res);
            this.reset();
            if (code) this.sendError(res);
            this.runInstall();
        }  
     private pullF = function (cmd) {
            console.log('pullF:   ' + cmd);
            var res = '';
            var _this = this;
            var onData = function (err, stdout, stdin) {
                res += err + stdout + stdin;
            }
        var onClose = function (code) { _this.onPullComplete(res, code); }
       return this.doCommand(cmd, onData, onClose);
        }
    /////////////////////////////////////////////////////////////////////////////////////////////////
    checkForUpdates(): boolean {
            return this.sendCommand('fetch');
        }


        constructor(private child, settings: any) {
            this.exec = child.exec;
            this.settings = settings
        this.PREF = settings.PREF
    }
        startTimer(): void {
            this.fetchTimer = setInterval(() => this.checkForUpdates(), 200000);
        }

        stopTimer(): void {
            clearInterval(this.fetchTimer);
        }


        onReady: Function;
        onNewData: Function;

        reset() {
            this.pc = 0;
            this.inProcess = 0;
            return 0;
        }

        runPull(): void {
            this.sendCommand('pull');
        }

        runClone(): void {
            this.sendCommand('clone')
    }

        sendCommand(chunk) {
            var cmd = this.settings[chunk];
            if (!cmd) return false;
            if (this.pc) return false;
            this.inProcess = chunk;
            var fun = this[this.inProcess + 'F'];//(this.PREF + cmd.cmd);
            if (typeof fun !== 'function') return this.reset();
            this.pc = fun.call(this, this.PREF + cmd.cmd);
            // this.pc = this.exec(this.PREF + cmd.cmd, null, (err, stdout, stdin) => callback(err, stdout, stdin));
            // this.pc.on('close',(code)=> this.onClose(code));  
            // console.log(_this.onClose);
            return this.pc;
        }


    }

}

initMe(child);

