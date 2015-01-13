export class AppCommander {
    private exec
    private pc: any;
    private PREF: string; 
    private APP_FOLDER: string;  

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