var cpanel;
(function (cpanel) {
    var Connector = (function () {
        function Connector() {
        }
        Connector.prototype.getFolderContent = function (path, callBack) {
            $.get('fileM/fs/readdir?' + path, callBack);
        };
        Connector.prototype.getFolderContentStats = function (path, callBack) {
            $.get('fileM/getDirStats?' + path, callBack);
        };
        return Connector;
    })();
    cpanel.Connector = Connector;
})(cpanel || (cpanel = {}));
//# sourceMappingURL=Connector.js.map
