var child = require('child_process');
import GC= require('./GitCommander');
import AC = require('./AppCommander');
var error: number = 0;


var INSTALL_FOLDER: string = 'myapp';

var GITURL: string = 'https://github.com/vladvaldtitov/node_CPanel.git';
//var APP_FOLDER: string = INSTALL_FOLDER + '/node_CPanel';
var APP_FOLDER: string = INSTALL_FOLDER + '';

var settings = {
    INSTALL_FOLDER: INSTALL_FOLDER,
    GITURL: GITURL,
    APP_FOLDER: APP_FOLDER,
    CHECK_TIMER:20000,
    isProd:0
   // server: 'app.js',
   // PREF: 'cd ' + INSTALL_FOLDER + ' && ',
   // clone: { cmd: 'cd .. & git clone ' + GITURL + ' ' + INSTALL_FOLDER },
    //pull: { cmd: 'git pull' },
    //install: { cmd: 'npm install' },
    //fetch: { cmd: 'git fetch' }
}

var gitCtr:GC.GitCommander
var server: AC.AppCommander;

var onGitReady = function () {
    console.log('onGitReady');
    if (!server) {
        server = new AC.AppCommander(child, settings);
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

var startClone = function() {
    // gitCtr.runClone();
    // gitCtr.runInstall();
    gitCtr.runFetch();
}
var onAppTaskComlete = function (mode: string, code: number) {

}


var onGitTaskComlete = function (mode: string, code: number) {
    switch (mode) {
        case 'clone':
            gitCtr.runInstall();
            break;
        case 'install':
            gitCtr.startTimer();
            break;
        case 'newdata':
            break;

    }


};

function initMe(child) {
    error = 0;
    gitCtr = new GC.GitCommander(child, settings);
   // gitCtr.onReady = onGitReady;
   // gitCtr.onNewData = onHaveUpdate;

    gitCtr.onComplete = onGitTaskComlete; 
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
        
        // console.log(chunk);  
    });


}

initMe(child);

