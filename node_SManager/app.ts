var child = require('child_process');
import GC= require('./GitController');
import AC = require('./AppController');
var error: number = 0;


var FOLDER: string = 'myserver';
//var GITURL: string = 'https://github.com/vladvaldtitov/SimpleServer.git';
var GITURL: string = 'https://github.com/vladvaldtitov/node_CPanel.git';

var settings = {
    FOLDER: FOLDER,
    GITURL: GITURL,
    server: 'app.js',
    PREF: 'cd ' + FOLDER + ' && ',
    clone: { cmd: 'cd .. & git clone ' + GITURL + ' ' + FOLDER },
    pull: { cmd: 'git pull' },
    install: { cmd: 'npm install' },
    fetch: { cmd: 'git fetch' }
}
////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////////////

var gitCtr:GC.GitController
var server: AC.AppController;

var onGitReady = function () {
    console.log('onGitReady');
    if (!server) {
        server = new AC.AppController(child, settings);
        server.onServerStoped = onServerStoped;
    }
    gitCtr.startTimer();
    server.startApplication();
    
}
var onServerStoped = function () {
    console.log('server stoped ready for update');
    gitCtr.runPull();
}
var stopServer = function () {
    server.stopApplication();
}

var onHaveUpdate = function () {
    gitCtr.stopTimer();
    stopServer();
}

var startClone(): void {
    gitCtr.runClone();
}


function initMe(child) {
    error = 0;
    gitCtr = new GC.GitController(child, settings);
    gitCtr.onReady = onGitReady;
    gitCtr.onNewData = onHaveUpdate;

    setTimeout(startClone, 1000);
    var exec = child.exec;
    process.stdin.setEncoding('utf8');
    process.on('uncaughtException', function (err) {
        error = err.stack;
        console.error('An uncaught error occurred!', err.stack);
    });

    var onData = function (err, stdout, stdin) {
        console.log('err: ', err);
        console.log('out :', stdout);
        console.log('stdin: ', stdin);
    }


    process.stdin.on('readable', function () {
        var chunk = process.stdin.read();
        if (!chunk) return;
        if (chunk.trim() == 'stop') {
            stopServer();
            return;
        }
        if (!gitCtr.sendCommand(chunk.trim())) exec(chunk, null, onData);
        // console.log(chunk);  
    }
        );
}

initMe(child);

