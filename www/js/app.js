// Global variables
var active;
var routes;
var router;
var sessionID;
var cityReferences;
var responseForms;
var geoResponse;
var lang = 'en';
var request = superagent;
var requestHeaders = {
    'Accept': 'application/json',
    'x-api-key': APP_CONFIG.LEADPIPES_API_KEY
}

var onDocumentLoad = function(e) {
    cityReferences = document.getElementsByClassName('geo-city');
    responseForms = document.getElementsByClassName('user-info');

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

        if (cardID != COPY.content.initial_card) {
            if (!sessionID) makeSessionID();
            if (!geoResponse) geoLocate();
        }
    } else {
        console.error('Route "' + cardID + '" does not exist');
    }
}

var makeSessionID = function() {
    var storedID = STORAGE.get('sessionID');
    if (!storedID) {
        request
            .get(APP_CONFIG.LEADPIPES_API_BASEURL + '/uuid')
            .set(requestHeaders)
            .end(handleSessionRequest);
    } else {
        sessionID = storedID;
    }
}

var handleSessionRequest = function(err, res) {
    if (err || !res.ok) {
        console.error('ajax error', err, res);
    } else {
        sessionID = res.body;
        STORAGE.set('sessionID', sessionID, APP_CONFIG.LEADPIPES_SESSION_TTL);
    }
}

var geoLocate = function() {
    var storedResponse = STORAGE.get('geoResponse');
    if (!storedResponse && typeof geoip2 === 'object') {
        geoip2.city(onLocateIP, onLocateFail);
    } else {
        geoResponse = storedResponse;
    }
}

var onLocateIP = function(response) {
    geoResponse = response;
    STORAGE.set('geoResponse', response, APP_CONFIG.LEADPIPES_SESSION_TTL);
    //for (var i = 0; i < cityReferences.length; ++i) {
        //var item = cityReferences[i];
        //item.innerHTML = response.city.names[lang] + ', ' + response.most_specific_subdivision.iso_code;
    //}
}

var onLocateFail = function(response) {
    console.error('geoip locate failed');
}

var listenResponseFormSubmit = function() {
    for (var i = 0; i < responseForms.length; ++i) {
        var responseForm = responseForms[i];
        responseForm.addEventListener('submit', onSubmitResponseForm);
    }
}

var onSubmitResponseForm = function(e, data) {
    e.preventDefault();
    var data = serialize(e.target);
    data.sessionid = sessionID;
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
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
