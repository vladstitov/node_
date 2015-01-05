
var LISTVIEW: string = 'ListView';

var MENUVIEW: string = 'MenuView';

var TYPING: string = 'typing';

var CHANGE: string = 'change';
var CHECKED: string = 'checked';
var DISABLED: string = 'disabled';
var SELECTED: string = 'selected';

var IMG: string = 'img';
var SRC: string = 'src';
var ALERT: string = 'myAlert';

var ALERT_YES: string = 'alert_yes';
var ALERT_NO: string = 'alert_no';
var CLICK: string = 'click';

var REMOVE: string = 'remove';
var SHOW: string = 'show';
var HIDE: string = 'hide';
var CLOSE:string='close';
var CREATE:string='create';

var onAlertYes: Function;
var myAlert: JQuery;
var myAlertTitle: JQuery;
var myAlertMsg: JQuery;

var showAlert = function (msg, onYes: Function, title) {
    if (!myAlert) initAlert();
    onAlertYes = onYes;
    myAlertMsg.text(msg);
    if (!title) title = 'Alert';
    myAlertTitle.text(title);
    myAlert.show();
}

var mymessage:JQuery;

var myMsg = function (msg, ref: JQuery) {
    
    if (!mymessage) mymessage = $('<div id="mymsg"></div>').appendTo('body');
  
    var obj:any = ref.position();
    obj.top += 20;
    mymessage.css(obj);
    mymessage.text(msg).show('fast').delay(2100).hide('fast');   
}

var myMsg2 = function (msg, ref: JQuery) {

    var mymsg = $('<div class="mymsg2"></div>').appendTo(ref.parent());

    //var obj: any = ref.position();
    // obj.top += 20;
    // msg.css(obj);
    mymsg.text(msg).show('fast').delay(2100).hide('fast');
    setTimeout(function () { mymsg.remove(); },2500);
}
var initAlert = function () {
    myAlert = $('#myAlert');
    myAlertMsg = $('#alert_msg');
    myAlertTitle = $('#alertTitle');
    $('#myAlert button').on(CLICK, function (evt) {
        if ($(evt.target).data()['id'] == 'yes') onAlertYes();
        myAlert.hide();
    });   
}


module cpanel {
   export class RegA {
        register(obj: any): void {
            this[obj.id] = obj
        }

        getObject(id: string): any {
            return this[id];
        }
       // model: admin.DestinantionsModel;
       // modelCats: admin.ModelCategories;
        connector: Connector;
       // cover = $('<div id="cover"></div>');
        settings: any;
        device: {} = { device: 'admin', ln: 'en' };

        private static _instance: RegA = new RegA();
        public static getInstance(): RegA {
            return RegA._instance;
        }


    }
}