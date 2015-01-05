module cpanel {

    interface stats {
        attime: string;
        ctime: string;
        dev: number;
        filename: string;
        gid: number;
        ino: number;
        mode: number;
        mtime: string;
        nlink: number;
        rdev: number;
        size: number;
        uid: number;
        errno: number;
        code: string;
    }

    export class FFM {
        private R: RegA;

        private header: JQuery;
        private folderView: JQuery;
        private fullView: JQuery;
        private sButton: JQuery;
        private sPanel: JQuery;
        private sTools: JQuery;
        private currentFolder: string = 'c:/';
        private renderName(item: string): string {
            return '<li class="item" >' + item + '</li>';
        }
        private onFolderContent(data:string[]): void {
            var ul: string = '<ul>';
            console.log(data);
            for (var i = 0, n = data.length; i < n; i++) ul += this.renderName(data[i]);
            ul += '</ul>';
            this.folderView.html(ul);
        }

        private onTIEnter(evt) {
            if (evt.charCode !=13) return;
            var path: string = this.header.val();
            if (path && path.length > 2) this.currentFolder = path;
            this.getCurrentFolderData();
        }
        private renderError(stat: stats): string {
            return '<li class="error"> <div class="stat filename">' + stat.filename + '</div><div class="stat perm">' + stat.errno + '</div><div class="stat mode">' + stat.code + '</div></li>';
        }
        private renderItemWS(stat: stats):string { 
            if (stat.errno) return this.renderError(stat);         
            var mode = stat.mode
            var t = 'folder';            
            var perm = parseInt(mode.toString(8), 10);  
            if (perm> 50000) t = 'file';  
            return '<li class="' + t + '"> <div class="stat filename">' + stat.filename + '</div><div class="stat perm">' + perm + '</div><div class="stat mode">'+mode+'</div></li>';
        }
        private data: stats[];
        private onDataWithStats(data:stats[]): void {
            console.log(data);
            this.data = data;
            this.renderData();
        }

        private renderData(): void {
            var data: stats[] = this.data;
            if (!data) return;
            var m: string[] = [];
            var head: JQuery = $('<div></div>').addClass('headrow').html('<div  class="stat filename" >File Name</div><div class="stat perm">Permissions</div><div class="stat mode">Mode</div>');
           

            var out: string = '<ul>';
            for (var i = 0, n = data.length; i < n; i++)out+=this.renderItemWS(data[i]);
                out += '</ul>';
            this.folderView.html(out);
            this.folderView.prepend(head);
        }
        private mask: JQuery[];
        private getCurrentFolderData(): void { 
            this.R.connector.getFolderContentStats(this.currentFolder, (data) => this.onDataWithStats(data))
            /*
            this.mask = null; 
            var ar: JQuery[] = this.getOptions();
            if (ar.length) {
                this.mask = ar;
                this.R.connector.getFolderContentStats(this.currentFolder, (data) => this.onDataWithStats(data))
            }else  this.R.connector.getFolderContent(this.currentFolder, (data) => this.onFolderContent(data));
*/
        }
        private closePanel(): void {
            this.sButton.show();
            this.sTools.hide('fast');
        }

        private getOptions(): JQuery[] {
            var out: JQuery[] = [];
            this.sTools.children('input').each(function (ind, elem) {
                if ($(elem).prop('checked')) out.push($(elem));                
            });
            return out;
        }
        private createSettingPanel(): void {            
            var opt: any[] = [{ name: 'Permissions', val: ' mode' }, {name:'Date Created',val:'ctime' }, {name: 'Date Modified',val:'mtime' }];
           var close =  $('<span>').addClass('closebtn').html('X').on(CLICK, null, () => this.closePanel());
            this.sTools = $('<div>').addClass('tools')
            var str: string = '';
            for (var i = 0, n = opt.length; i < n; i++)str += '<input type="checkbox"  value="' + opt[i].val + '"  title="' + opt[i].name+'"/>'+opt[i].name ;
            this.sTools.html(str);
            this.sTools.prepend(close);
            this.sTools.hide().appendTo(this.sPanel);
        }
       
            

        private openPanel(): void {
            this.sButton.hide();
            this.sTools.show('fast');
        }
        private onFolderClick(evt:JQueryEventObject): void {
            var folder = $(evt.target).text();
            console.log(folder);
            if (this.currentFolder.substr(-1) != '/') folder = '/' + folder
            this.header.val(this.currentFolder + folder);
        }
        constructor(private viewPort) {
            this.R = RegA.getInstance(); 
            this.sPanel = $('<div>').addClass('spanel').appendTo(viewPort);
            this.sButton = $('<div>').html('S').appendTo(this.sPanel).on(CLICK, null, () => this.openPanel());  
            this.header = $('<input type="text" />').addClass('header').val(this.currentFolder).appendTo(viewPort);
            this.header.keypress((evt)=>this.onTIEnter(evt));
            this.fullView = $('<div><div>').attr('id','FFM').appendTo(viewPort);
            this.folderView = $('<div>').addClass('folderview').appendTo(this.fullView);
            setTimeout(() => this.getCurrentFolderData(), 1000);
            this.createSettingPanel();
            this.folderView.on(CLICK, '.folder', (evt) => this.onFolderClick(evt));
        }

        getFolderWithStats(path) {
            this.R.connector.getFolderContentStats(path, (data) => this.onDataWithStats(data));

        }

    }

}