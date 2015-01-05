
module cpanel {
    export class Main {   
        private R: RegA;
        private ffm: FFM;
        constructor() {
            this.R = RegA.getInstance();
            this.R.connector = new Connector();
            this.ffm = new FFM($('#content'));
           // this.R.connector.getSettings((resp) => { this.R.settings = JSON.parse(resp); this.init(); });

        }
        private header: JQuery;
        private title: JQuery;
        private btnSave: JQuery;
        private btnRestart: JQuery;

        private init(): void {
            // trace('directories.admin init ');
            this.header = $('#adminHeader');
            //this.selected = this.header.children('a').on(CLICK, (evt) => this.onHrefClick(evt)).first().addClass(SELECTED);          

           // $(window).on('hashchange', (evt) => this.onHachChange());

            //$.ajaxSetup({ cache: false });

            //if (R.settings.admin) this.title.text(R.settings.admin.title);
        }
    }
}

$(document).ready(function () {        
    var panel = new cpanel.Main();
    //////////////////////////////////////////////////////////////// Debug purpose only ///////////////////////////
    setTimeout(function () {

    }, 1000);
    /////////////////////////////////////////////////////////     
});