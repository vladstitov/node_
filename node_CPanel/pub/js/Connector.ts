module cpanel {
    export class Connector {
        public getFolderContent(path: string, callBack: Function): void {
            $.get('fileM/fs/readdir?' + path, callBack);
        }
        public getFolderContentStats(path: string, callBack: Function): void {
            $.get('fileM/getDirStats?' + path, callBack);
        }
    }
}