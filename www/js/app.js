// Global variables
var active;
var routes;
var router;
var sessionID;
var cityReferences;
var geoResponse;
var lang = 'en';
var request = superagent;
var requestHeaders = {
    'Accept': 'application/json',
    'x-api-key': APP_CONFIG.LEADPIPES_API_KEY
}

var onDocumentLoad = function(e) {
    cityReferences = document.getElementsByClassName('geo-city');
    var routes = {
        '/:cardID': navigateToCard
    }
    router = Router(routes);
    router.init([COPY.content.initial_card]);
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
            makeSessionID();
            geoLocate();
        }
    } else {
        console.error('Route "' + cardID + '" does not exist');
    }
}

var makeSessionID = function() {
    if (!sessionID) {
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
    if (!geoResponse && typeof geoip2 === 'object') {
        var storedResponse = STORAGE.get('geoResponse');
        if (!storedResponse) {
            geoip2.city(onLocateIP, onLocateFail);
        } else {
            geoResponse = storedResponse;
        }
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
    console.log('locate failed');
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
