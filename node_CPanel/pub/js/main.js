var cpanel;
(function (cpanel) {
    var Main = (function () {
        function Main() {
            this.R = cpanel.RegA.getInstance();
            this.R.connector = new cpanel.Connector();
            this.ffm = new cpanel.FFM($('#content'));
            // this.R.connector.getSettings((resp) => { this.R.settings = JSON.parse(resp); this.init(); });
        }
        Main.prototype.init = function () {
            // trace('directories.admin init ');
            this.header = $('#adminHeader');
            //this.selected = this.header.children('a').on(CLICK, (evt) => this.onHrefClick(evt)).first().addClass(SELECTED);
            // $(window).on('hashchange', (evt) => this.onHachChange());
            //$.ajaxSetup({ cache: false });
            //if (R.settings.admin) this.title.text(R.settings.admin.title);
        };
        return Main;
    })();
    cpanel.Main = Main;
})(cpanel || (cpanel = {}));

$(document).ready(function () {
    var panel = new cpanel.Main();

    //////////////////////////////////////////////////////////////// Debug purpose only ///////////////////////////
    setTimeout(function () {
    }, 1000);
    /////////////////////////////////////////////////////////
});
//# sourceMappingURL=main.js.map
