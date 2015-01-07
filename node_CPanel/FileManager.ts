import fs = require("fs");

export class FileManager {
    private fs = fs
    constructor() {

    }

    private onDirFiles(dir: string, err: ErrnoException, files: string[], callBack: Function): void {
        if (!files) {
            callBack({ error: 'cant get files from directory: ' + dir });
            return;
        }
        var i: number = 0;

        var n: number = files.length;
        var fs = this.fs;
        var filename: string;
        var out: any[] = []

        var mask: number = 2;
        var onStat = function (er, stat) {
            if (er) stat = er;
            stat.filename = filename;
            //stat.perm = parseInt(stat.mode.toString(8), 10);           
            out.push(stat);
            i++;
            if (i < n) getNextStatus(files[i])
             else callBack(out);
        }

        var getNextStatus = function (name) {
            //  console.log('getting stat of: ' + name);
            filename = name;
            fs.stat(dir + '/' + name, onStat);
        }

        getNextStatus(files[0]);
    }
    private onDirReady: Function;
    private _callBack: Function;

    processRequest(func: string[], args: any[], callBack: Function): void {
        this._callBack = callBack;
        var f: Function
        if (func.length == 1) {
            f = this[func[0]];
            // console.log('processRequest of 1 ' + func, f);
            args.push(callBack);
            if (typeof f === 'function') f.apply(this, args);
            else callBack({ error: 'no function ' + func[0] + ' in FileManager' });
        } else if (func.length == 2) {
            var result = function (err, data) { callBack(data); }
            args.push(result)
            var obj: any = this[func[0]];
            var f: Function = obj[func[1]];
            //  console.log('processRequest of 2 ' + func[0] + ' 1: ' + func[1], f);            
            //  console.log('processRequest arguments: ', args.push(result));
            if (typeof f === 'function') f.apply(this, args);
            else callBack({ error: 'Cant find function of: ' + func[0] + '.' + func[1] });
        } else callBack({ error: 'processRequest function lenfth not 1 or 2 ' + func });
    }


    getDirStats(path: string, callBack: Function): void {
        // var callBack:Function = this._callBack;             
        this.fs.readdir(path, (err: ErrnoException, files: string[]) => this.onDirFiles(path, err, files, callBack));
    }


}

