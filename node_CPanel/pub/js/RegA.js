var LISTVIEW = 'ListView';

var MENUVIEW = 'MenuView';

var TYPING = 'typing';

var CHANGE = 'change';
var CHECKED = 'checked';
var DISABLED = 'disabled';
var SELECTED = 'selected';

var IMG = 'img';
var SRC = 'src';
var ALERT = 'myAlert';

var ALERT_YES = 'alert_yes';
var ALERT_NO = 'alert_no';
var CLICK = 'click';

var REMOVE = 'remove';
var SHOW = 'show';
var HIDE = 'hide';
var CLOSE = 'close';
var CREATE = 'create';

var onAlertYes;
var myAlert;
var myAlertTitle;
var myAlertMsg;

var showAlert = function (msg, onYes, title) {
    if (!myAlert)
        initAlert();
    onAlertYes = onYes;
    myAlertMsg.text(msg);
    if (!title)
        title = 'Alert';
    myAlertTitle.text(title);
    myAlert.show();
};

var mymessage;

var myMsg = function (msg, ref) {
    if (!mymessage)
        mymessage = $('<div id="mymsg"></div>').appendTo('body');

    var obj = ref.position();
    obj.top += 20;
    mymessage.css(obj);
    mymessage.text(msg).show('fast').delay(2100).hide('fast');
};

var myMsg2 = function (msg, ref) {
    var mymsg = $('<div class="mymsg2"></div>').appendTo(ref.parent());

    //var obj: any = ref.position();
    // obj.top += 20;
    // msg.css(obj);
    mymsg.text(msg).show('fast').delay(2100).hide('fast');
    setTimeout(function () {
        mymsg.remove();
    }, 2500);
};
var initAlert = function () {
    myAlert = $('#myAlert');
    myAlertMsg = $('#alert_msg');
    myAlertTitle = $('#alertTitle');
    $('#myAlert button').on(CLICK, function (evt) {
        if ($(evt.target).data()['id'] == 'yes')
            onAlertYes();
        myAlert.hide();
    });
};

var cpanel;
(function (cpanel) {
    var RegA = (function () {
        function RegA() {
            this.device = { device: 'admin', ln: 'en' };
        }
        RegA.prototype.register = function (obj) {
            this[obj.id] = obj;
        };

        RegA.prototype.getObject = function (id) {
            return this[id];
        };

        RegA.getInstance = function () {
            return RegA._instance;
        };
        RegA._instance = new RegA();
        return RegA;
    })();
    cpanel.RegA = RegA;
})(cpanel || (cpanel = {}));
//# sourceMappingURL=RegA.js.map
