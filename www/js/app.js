// Global variables
var active;
var router;
var resultPage;
var responseForms;
var formMessages;
var sessionID;
var request = superagent;
var requestHeaders = {
    'Accept': 'application/json'
}

var onDocumentLoad = function(e) {
    sessionID = lscache.get('LeadPipesSessionID');
    initInterface();
    checkIfVisited();
    initRouter();
}

var initRouter = function() {
    var routes = {
        '/:cardID': navigateToCard
    }
    router = Router(routes);

    if (!sessionID) {
        request
            .get(APP_CONFIG.LEADPIPES_API_BASEURL + '/uuid')
            .set(requestHeaders)
            .end(handleSessionRequest);
    } else {
        setupSession();
    }
}

var handleSessionRequest = function(err, res) {
    if (err || !res.ok) {
        console.error('ajax error', err, res);
    } else {
        sessionID = res.body;
        setupSession();
    }
}

var setupSession = function() {
    if (!APP_CONFIG.DEBUG) {
        lscache.set('LeadPipesSessionID', sessionID, parseInt(COPY.content.session_ttl));
        window.location.hash = '';
    }
    router.init([COPY.content.initial_card]);
}

var initInterface = function() {
    responseForms = document.getElementsByClassName('user-info');
    formMessages = document.getElementsByClassName('submit-message');

    listenBackButtonClick();
    listenAgainLinkClick();
    listenResponseFormSubmit();
};

var listenAgainLinkClick = function() {
    var againLinks = document.getElementsByClassName('submit-again-link');
    for (var i = 0; i < againLinks.length; i++) {
        var againLink = againLinks[i];
        againLink.addEventListener('click', startProcessOver);
    }
};

var startProcessOver = function(e) {
    e.preventDefault();

    resultPage = null;
    lscache.remove('resultPage');

    toggleFormVisibility(true);

    router.setRoute('water-meter');
}

var checkIfVisited = function() {
    var cachedResult = lscache.get('resultPage');
    if (cachedResult && cachedResult !== 'undefined') {
        router.setRoute(cachedResult);
        toggleFormVisibility(false);
    }
}

var navigateToCard = function(cardID) {
    if (cardID == '') cardID = COPY.content.initial_card;
    document.body.scrollTop = 0;
    var nextCard = document.getElementById(cardID);
    if (nextCard) {
        if (active) {
            active.classList.remove('active');
        }
        nextCard.classList.add('active');
        active = nextCard;
        ANALYTICS.trackEvent('navigate', cardID);
    } else {
        console.error('Route "' + cardID + '" does not exist');
        router.setRoute(COPY.content.initial_card);
    }
}

var listenBackButtonClick = function() {
    var backButtons = document.getElementsByClassName('back');
    for (var i = 0; i < backButtons.length; i++) {
        var backButton = backButtons[i];
        backButton.addEventListener('click', onBackButtonClick);
    }
}


var onBackButtonClick = function(e) {
    e.preventDefault();
    window.history.go(-1);
}

var listenResponseFormSubmit = function() {
    for (var i = 0; i < responseForms.length; i++) {
        var responseForm = responseForms[i];
        responseForm.addEventListener('submit', onSubmitResponseForm);
    }
}

var onSubmitResponseForm = function(e, data) {
    e.preventDefault();
    var data = serialize(e.target);
    data['sessionid'] = sessionID;
    data['resultPage'] = active.id;
    request
        .post(APP_CONFIG.LEADPIPES_API_BASEURL + '/form')
        .send(data)
        .set(requestHeaders)
        .set('Content-Type', 'application/json')
        .end(handleSubmitResponse);

}

var handleSubmitResponse = function(err, res) {
    toggleFormVisibility(false);
    // Reset ttl
    lscache.set('resultPage', resultPage, APP_CONFIG.LEADPIPES_SESSION_TTL);
}

var toggleFormVisibility = function(formVisible) {
    for (var i = 0; i < responseForms.length; i++) {
        var responseForm = responseForms[i];
        var formMessage = formMessages[i];

        if (formVisible) {
            responseForm.className = 'user-info';
            formMessage.className += ' message-hidden';
            responseForm.reset();
        } else {
            responseForm.className += ' form-hidden';
            formMessage.className = 'submit-message';
        }
    }
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
