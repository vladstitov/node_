/// <reference path="typing/node.d.ts" />
import fs = require("fs");
import events = require("events");
import zlib = require("zlib");
import url = require('url');
import util = require("util");
import crypto = require("crypto");
import http = require("http");
import net = require("net");
import child = require('child_process');


module kiosk {



    export class Manager {
        private app:child.ChildProcess;
       // private child;

        constructor() {
          //  this.child = child;
           
            process.on('uncaughtException', (err) => this.onError(err));
        }
        private onError(err: any): void {

            console.error('An uncaught error occurred!', err.stack);
        }

        private kill(callBack:Function) {           
            child.exec('taskkill /F /IM chrome.exe', function (error: Error, stdout: Buffer, stderr: Buffer) {
                callBack(stdout);

            });
        }


        private startApp() {

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
        }

        private flag: number = 0;
        private vars: any;
        private url = require('url');
        private pid: number;


        private onRequest(req:http.ServerRequest, resp:http.ServerResponse) {


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
            }
            else if (req.method == 'GET') {
                this.vars = {};
                var q = this.url.parse(req.url, true).query;
                console.log(req.url);
                console.log(q);

                if (q.hey) {
                    if (q.hey == 'clear') this.kill((out) => { this.sendRespond(resp, out); });
                    if (q.hey == 'start')  this.sendRespond(resp, { pid: this.startApp()});                    
                    if (q.hey == 'stop') this.sendRespond(resp, this.stop());  
                                       
                  
                    if (q.hey == 'get') this.getProcessMemory(q.pid|| this.app.pid, (mem) => { this.sendRespond(resp, mem); });

                    //this.vars.error = error;
                }

                

            }

        }

        private sendRespond(resp:http.ServerResponse,data:any): void {
            resp.writeHead(200);
            resp.write((typeof data =='string')?data:JSON.stringify(data));
            resp.end();


        }
        private stop():string {
            return 'success';
        }

        startServer(port?: number): void {
            http.createServer((req, resp) => this.onRequest(req, resp)).listen(port || 1337);
        }
        private getProcessMemory(pid: number,callBack:Function): void {
            var out;
            child.exec('tasklist /fi "PID eq ' + pid + '" /fo  CSV /nh', function (err:Error, stdout:Buffer, stderr:Buffer) {
                var str: string = stdout.toString();
                out = str.substr(str.lastIndexOf('","') + 3);
                callBack(out);
            });
        }




    }

}


var manager: kiosk.Manager = new kiosk.Manager();
manager.startServer();