var cpanel;
(function (cpanel) {
    var FFM = (function () {
        function FFM(viewPort) {
            var _this = this;
            this.viewPort = viewPort;
            this.currentFolder = '/';
            this.R = cpanel.RegA.getInstance();
            this.sPanel = $('<div>').addClass('spanel').appendTo(viewPort);
            this.sButton = $('<div>').html('S').appendTo(this.sPanel).on(CLICK, null, function () {
                return _this.openPanel();
            });

            this.header = $('<input type="text" />').addClass('header').val(this.currentFolder);

            var backBtn = $('<div>').addClass('btnBack').text('<-').on(CLICK, null, function (evt) {
                return _this.onBackClick(evt);
            });
            $('<div>').addClass('tools').append(backBtn).append(this.header).appendTo(viewPort);
            this.header.keypress(function (evt) {
                return _this.onTIEnter(evt);
            });

            this.fullView = $('<div><div>').attr('id', 'FFM').appendTo(viewPort);
            this.folderView = $('<div>').addClass('folderview').appendTo(this.fullView);
            setTimeout(function () {
                return _this.getCurrentFolderData();
            }, 1000);
            this.createSettingPanel();
            this.folderView.on(CLICK, '.folder', function (evt) {
                return _this.onFolderClick(evt);
            });
            this.folderView.dblclick('.folder', function (evt) {
                return _this.onFolderDoubleClick(evt);
            });
        }
        FFM.prototype.renderName = function (item) {
            return '<li class="item" >' + item + '</li>';
        };
        FFM.prototype.onFolderContent = function (data) {
            var ul = '<ul>';
            console.log(data);
            for (var i = 0, n = data.length; i < n; i++)
                ul += this.renderName(data[i]);
            ul += '</ul>';
            this.folderView.html(ul);
        };

        FFM.prototype.onTIEnter = function (evt) {
            if (evt.charCode == 13) {
                this.getFolderData();
            }
        };
        FFM.prototype.getFolderData = function () {
            var path = this.header.val();
            if (path.length == 0)
                this.header.val('/');
            this.currentFolder = this.header.val();
            this.getCurrentFolderData();
        };
        FFM.prototype.renderError = function (stat) {
            return '<li class="error"> <div class="stat filename">' + stat.filename + '</div><div class="stat perm">' + stat.errno + '</div><div class="stat mode">' + stat.code + '</div></li>';
        };
        FFM.prototype.renderItemWS = function (stat) {
            if (stat.errno)
                return this.renderError(stat);
            var mode = stat.mode;
            var t = 'folder';
            var perm = parseInt(mode.toString(8), 10);
            if (perm > 50000)
                t = 'file';
            return '<li class="' + t + '"> <div class="stat filename">' + stat.filename + '</div><div class="stat perm">' + perm + '</div><div class="stat mode">' + mode + '</div></li>';
        };

        FFM.prototype.onDataWithStats = function (data) {
            console.log(data);
            this.data = data;
            this.renderData();
        };

        FFM.prototype.renderData = function () {
            var data = this.data;
            if (!data)
                return;
            var m = [];
            var head = $('<div></div>').addClass('headrow').html('<div  class="stat filename" >File Name</div><div class="stat perm">Permissions</div><div class="stat mode">Mode</div>');

            var out = '<ul>';
            for (var i = 0, n = data.length; i < n; i++)
                out += this.renderItemWS(data[i]);
            out += '</ul>';
            this.folderView.html(out);
            this.folderView.prepend(head);
        };

        FFM.prototype.getCurrentFolderData = function () {
            var _this = this;
            this.header.val(this.currentFolder);
            this.R.connector.getFolderContentStats(this.currentFolder, function (data) {
                return _this.onDataWithStats(data);
            });
            /*
            this.mask = null;
            var ar: JQuery[] = this.getOptions();
            if (ar.length) {
            this.mask = ar;
            this.R.connector.getFolderContentStats(this.currentFolder, (data) => this.onDataWithStats(data))
            }else  this.R.connector.getFolderContent(this.currentFolder, (data) => this.onFolderContent(data));
            */
        };
        FFM.prototype.closePanel = function () {
            this.sButton.show();
            this.sTools.hide('fast');
        };

        FFM.prototype.getOptions = function () {
            var out = [];
            this.sTools.children('input').each(function (ind, elem) {
                if ($(elem).prop('checked'))
                    out.push($(elem));
            });
            return out;
        };
        FFM.prototype.createSettingPanel = function () {
            var _this = this;
            var opt = [{ name: 'Permissions', val: ' mode' }, { name: 'Date Created', val: 'ctime' }, { name: 'Date Modified', val: 'mtime' }];
            var close = $('<span>').addClass('closebtn').html('X').on(CLICK, null, function () {
                return _this.closePanel();
            });
            this.sTools = $('<div>').addClass('tools');
            var str = '';
            for (var i = 0, n = opt.length; i < n; i++)
                str += '<input type="checkbox"  value="' + opt[i].val + '"  title="' + opt[i].name + '"/>' + opt[i].name;
            this.sTools.html(str);
            this.sTools.prepend(close);
            this.sTools.hide().appendTo(this.sPanel);
        };

        FFM.prototype.openPanel = function () {
            this.sButton.hide();
            this.sTools.show('fast');
        };
        FFM.prototype.onFolderClick = function (evt) {
            var folder = $(evt.target).text();

            //  console.log(folder);
            if (this.currentFolder.substr(-1) != '/')
                folder = '/' + folder;
            this.header.val(this.currentFolder + folder);
        };

        FFM.prototype.onBackClick = function (evt) {
            var folder = this.header.val();
            var ind = folder.lastIndexOf('/');
            folder = folder.substr(0, ind);
            this.header.val(folder);
            this.getFolderData();
        };
        FFM.prototype.onFolderDoubleClick = function (evt) {
            this.getFolderData();
        };

        FFM.prototype.getFolderWithStats = function (path) {
            var _this = this;
            this.R.connector.getFolderContentStats(path, function (data) {
                return _this.onDataWithStats(data);
            });
        };
        return FFM;
    })();
    cpanel.FFM = FFM;
})(cpanel || (cpanel = {}));
//# sourceMappingURL=FFM.js.map
