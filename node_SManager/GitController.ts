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