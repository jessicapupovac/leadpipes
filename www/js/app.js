// Global variables
var active;
var router;
var sessionID;
var responseForms;
var backButtons;
var lang = 'en';
var request = superagent;
var requestHeaders = {
    'Accept': 'application/json'
}

var onDocumentLoad = function(e) {
    var routes = {
        '/:cardID': navigateToCard
    }

    router = Router(routes);
    router.init([COPY.content.initial_card]);

    listenResponseFormSubmit();
}

var navigateToCard = function(cardID) {
    document.body.scrollTop = 0;
    var nextCard = document.getElementById(cardID);
    if (nextCard) {
        if (active) {
            active.classList.remove('active');
        }
        nextCard.classList.add('active');
        active = nextCard;

        backButtons = document.getElementsByClassName('back');
        listenBackButtonClick();

        responseForms = document.getElementsByClassName('user-info');

        if (nextCard.querySelector('form.user-info')) {
            makeSessionID();
        }

        ANALYTICS.trackEvent('navigate', cardID);
    } else {
        console.error('Route "' + cardID + '" does not exist');
    }
    if (!APP_CONFIG.DEBUG) {
        router.setRoute('');
    }
}

var listenBackButtonClick = function() {
    for (var i = 0; i < backButtons.length; ++i) {
        var backButton = backButtons[i];
        backButton.addEventListener('click', onBackButtonClick);
    }
}


var onBackButtonClick = function(e) {
    e.preventDefault();
    window.history.go(-1);
}


var makeSessionID = function() {
    var storedID = lscache.get('sessionID');
    if (!storedID) {
        request
            .get(APP_CONFIG.LEADPIPES_API_BASEURL + '/uuid')
            .set(requestHeaders)
            .end(handleSessionRequest);
    }
}

var handleSessionRequest = function(err, res) {
    if (err || !res.ok) {
        console.error('ajax error', err, res);
    } else {
        lscache.set('sessionID', res.body, APP_CONFIG.LEADPIPES_SESSION_TTL);
    }
}

var listenResponseFormSubmit = function() {
    var responseForms = document.getElementsByClassName('user-info');
    for (var i = 0; i < responseForms.length; ++i) {
        var responseForm = responseForms[i];
        responseForm.addEventListener('submit', onSubmitResponseForm);
    }
}

var onSubmitResponseForm = function(e, data) {
    e.preventDefault();
    var data = serialize(e.target);
    data.sessionid = lscache.get('sessionID');
    request
        .post(APP_CONFIG.LEADPIPES_API_BASEURL + '/form')
        .send(data)
        .set(requestHeaders)
        .set('Content-Type', 'application/json')
        .end(handleSubmitResponse);

}

var handleSubmitResponse = function(err, res) {
    for (var i = 0; i < responseForms.length; ++i) {
        var responseForm = responseForms[i];
        responseForm.innerHTML = '<p>Done</p>';
    }
    // Reset ttl
    lscache.set('sessionID', sessionID, APP_CONFIG.LEADPIPES_SESSION_TTL);
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
