import AS = require('./AutServer');
var port = process.env.port || 1337

var server = new AS.AutServer();
server.createServer(false);


/////////////////////////////////Communication////////////////////////////////////////
process.stdin.setEncoding('utf8');

var onApplicationStoped = function () {
    process.stdout.write('FROM_APP_STOPPED\n');
}
var onApplicationStarted = function () {
    process.stdout.write('FROM_APP_STARTED\n');
}

process.stdin.on('readable', function () {
    var chunk = process.stdin.read();
    if (!chunk) return;   
    switch (chunk.trim()) {
        case 'stopapplication':
            process.stdout.write('FROM_APP_STOPPING\n');
            server.close();
            setTimeout(onApplicationStoped, 2000);
            break;
        case 'exitprocess':
            process.stdout.write('FROM_APP_BYE\n');
            process.exit();
            break;
        case 'startapplication':
            server.createServer(false);
            setTimeout(onApplicationStarted, 2000);
            break;
        case 'hello':
            process.stdout.write('FROM_APPLICATION_HELLO\n');
            break;
    }
}); 

 

