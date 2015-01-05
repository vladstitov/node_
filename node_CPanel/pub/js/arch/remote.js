var http = require("http");

var child = require('child_process');

var kiosk;
(function (kiosk) {
    var Manager = (function () {
        // private child;
        function Manager() {
            var _this = this;
            this.flag = 0;
            this.url = require('url');
            //  this.child = child;
            process.on('uncaughtException', function (err) {
                return _this.onError(err);
            });
        }
        Manager.prototype.onError = function (err) {
            console.error('An uncaught error occurred!', err.stack);
        };

        Manager.prototype.kill = function (callBack) {
            child.exec('taskkill /F /IM chrome.exe', function (error, stdout, stderr) {
                callBack(stdout);
            });
        };

        Manager.prototype.startApp = function () {
            //  var spawn = child.spawn;
            /*
            var args = [
            '--no-default-browser-check',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-dev-tools',
            '--incognito',
            '--kiosk',
            'http://localhost:8080/cms/trunk/RCMP.html?deviceId=103&languageCode=en'
            //'http://192.168.2.203:8080/cms/trunk/RCMP.html?deviceId=103&languageCode=en'
            ];
            */
            var args = [
                '--app',
                '--app-id=fldbbgioggkoioildaanbjdpnoffnaih'
            ];
            var cmd = 'C:/Users/jibestream/AppData/Local/Google/Chrome/Application/chrome.exe';

            // var cmd = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
            // var cmd = process.env.CHROME_BIN;
            this.app = child.spawn(cmd, args);

            // console.log('starting  Chrome   at ' + app.pid);
            return this.app.pid;
        };

        Manager.prototype.onRequest = function (req, resp) {
            var _this = this;
            // console.log(this.url.parse(req.url, true).query);
            ///console.log(req.url.pathname);
            this.flag = 1;
            req.setEncoding("utf8");

            // req.content = '';
            if (req.method == 'POST') {
                var body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    var POST = this.url.parse(body);

                    //console.log(POST);
                    resp.writeHead(200);
                    resp.write(JSON.stringify(POST));
                    resp.end();
                });
            } else if (req.method == 'GET') {
                this.vars = {};
                var q = this.url.parse(req.url, true).query;
                console.log(req.url);
                console.log(q);

                if (q.hey) {
                    if (q.hey == 'clear')
                        this.kill(function (out) {
                            _this.sendRespond(resp, out);
                        });
                    if (q.hey == 'start')
                        this.sendRespond(resp, { pid: this.startApp() });
                    if (q.hey == 'stop')
                        this.sendRespond(resp, this.stop());

                    if (q.hey == 'get')
                        this.getProcessMemory(q.pid || this.app.pid, function (mem) {
                            _this.sendRespond(resp, mem);
                        });
                    //this.vars.error = error;
                }
            }
        };

        Manager.prototype.sendRespond = function (resp, data) {
            resp.writeHead(200);
            resp.write((typeof data == 'string') ? data : JSON.stringify(data));
            resp.end();
        };
        Manager.prototype.stop = function () {
            return 'success';
        };

        Manager.prototype.startServer = function (port) {
            var _this = this;
            http.createServer(function (req, resp) {
                return _this.onRequest(req, resp);
            }).listen(port || 1337);
        };
        Manager.prototype.getProcessMemory = function (pid, callBack) {
            var out;
            child.exec('tasklist /fi "PID eq ' + pid + '" /fo  CSV /nh', function (err, stdout, stderr) {
                var str = stdout.toString();
                out = str.substr(str.lastIndexOf('","') + 3);
                callBack(out);
            });
        };
        return Manager;
    })();
    kiosk.Manager = Manager;
})(kiosk || (kiosk = {}));

var manager = new kiosk.Manager();
manager.startServer();
//# sourceMappingURL=remote.js.map
