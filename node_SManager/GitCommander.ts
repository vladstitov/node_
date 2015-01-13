export class GitCommander {
    private PREF;
    private INSTALL_FOLDER: string;
    private APP_FOLDER: string;
    private GITURL: string;
    private CHECK_TIMER:number = 200000;
   // private settings;
    private inProcess = 0;
    private pc: any = 0;
    private exec;
    private fetchTimer;
    private fs = require('fs'); 
    private isProd: boolean;  

    private doCommand(cmd: string, callBack: Function, onClose: Function): void {        
        var pc = this.exec(cmd, null, callBack);
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

   
    ///////////////////////////////////////////////////////////
    private haveNewData(): void {
        if (this.onNewData) this.onNewData();
    }    
     

    constructor(private child, settings: any) {
        this.exec = child.exec;     
        for (var str in settings) this[str] = settings[str];
    }

    private onData = function (err, stdout, stdin) {
       console.log('err: ', err);
        console.log('out :', stdout);
        console.log('stdin: ', stdin);
    }

    startTimer(): void {
        console.log('Starting timer '+this.CHECK_TIMER)
        this.fetchTimer = setInterval(() => this.runFetch(), this.CHECK_TIMER);
    }

    stopTimer(): void {
        clearInterval(this.fetchTimer);
    }


    onReady: Function;
    onNewData: Function;
    onComplete(mode: string, code: number): void {

    }

    reset() {
        this.pc = 0;
        this.inProcess = 0;
        return 0;
    }

    runFetch(): void {
        var mode:string = 'fetch';
        var cmd: string = 'git fetch ';
        var f = (err, stdout, stdin) => this.onData(err, stdout, stdin);
        if (this.isProd) f = null        
        else console.log(' Running: ' + cmd);
        this.pc = this.doCommand(cmd, f, (code) => this.onCommandDone(code, mode));  
    }

    runInstall(): void {
        var mode: string = 'install';
        var cmd: string = 'cd ' + this.INSTALL_FOLDER + ' && ' + ' npm install';
        var f = (err, stdout, stdin) => this.onData(err, stdout, stdin);
        if (this.isProd) f = null
         else console.log(' Running: ' + cmd);
       
        this.pc = this.doCommand(cmd, f, (code) => this.onCommandDone(code,mode));
    }

    runPull(): void {
        var mode: string = 'pull';
        var f = (err, stdout, stdin) => this.onData(err, stdout, stdin);
        if (this.isProd) f = null
        var cmd: string = 'cd ' + this.INSTALL_FOLDER + ' && ' + ' git pull';
        this.pc = this.doCommand(cmd, f, (code) => this.onCommandDone(code, mode));
    }




    private onCommandDone(code: number, mode: string): void {
        console.log('Mode ' + mode + ' finished with code: ' + code);


        this.onComplete(mode, code);

    } 

    runClone(): void {
        var mode: string = 'clone';
        var cmd: string = 'git clone ' + this.GITURL + ' ' + this.INSTALL_FOLDER +' --depth 1';
        var f = (err, stdout, stdin) => this.onData(err, stdout, stdin);
        if (this.isProd) f = null
        else console.log(' Running: ' + cmd);
       this.pc =  this.doCommand(cmd,f, (code) => this.onCommandDone(code, mode));      

    }
  

}