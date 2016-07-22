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
    initRouter();
    setTimeout(function() { window.scrollTo(0, 0);}, 1);
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
    checkIfSubmitted();
    if (!APP_CONFIG.DEBUG) {
        lscache.set('LeadPipesSessionID', sessionID, parseInt(COPY.config.session_ttl));
        window.location.hash = '';
    }
    router.init([COPY.config.initial_card]);
}

var initInterface = function() {
    responseForms = document.getElementsByClassName('user-info');
    formMessages = document.getElementsByClassName('submit-message');

    active = document.querySelector('.card.active');

    listenBackButtonClick();
    listenAgainLinkClick();
    listenResponseFormSubmit();
    listenShareButtonClick();
    listenLanguageButtonClick();

    loadAddEventButton();

};

var listenAgainLinkClick = function() {
    var againLinks = document.getElementsByClassName('submit-again-link');
    for (var i = 0; i < againLinks.length; i++) {
        var againLink = againLinks[i];
        againLink.addEventListener('click', startProcessOver);
    }
};

var listenShareButtonClick = function() {
    var shareButtons = document.querySelectorAll('.share-tools a');
    for (var i = 0; i < shareButtons.length; i++) {
        var button = shareButtons[i];
        button.addEventListener('click', onShareButtonClick);
    }

}

var onShareButtonClick = function() {
    var service = this.getAttribute('data-service');
    ANALYTICS.trackEvent('share', service);
}

var listenLanguageButtonClick = function() {
    var languageButtons = document.querySelectorAll('.language-selector button');
    for (var i = 0; i < languageButtons.length; i++) {
        var button = languageButtons[i];
        button.addEventListener('click', onLanguageButtonClick);
    }
}

var onLanguageButtonClick = function(e) {
    var activeClass = 'active';
    var activeButton = false;
    if (this.classList) {
        activeButton = this.classList.contains(activeClass);
    } else {
        activeButton = new RegExp('(^| )' + activeClass + '( |$)', 'gi').test(this.activeClass);
    }

    if (!activeButton) {
        var language = this.getAttribute('data-language');
        window.location = '../' + language + '/#' + active.id;
    }
}

var startProcessOver = function(e) {
    e.preventDefault();

    resultPage = null;
    lscache.remove('resultPage');

    toggleFormVisibility(true);

    router.setRoute('water-meter');
}

var checkIfSubmitted = function() {
    var cachedResult = lscache.get('resultPage');
    if (cachedResult && cachedResult !== 'undefined') {
        router.setRoute(cachedResult);
        toggleFormVisibility(false);
    }
}

var navigateToCard = function(cardID) {
    if (cardID == '') cardID = COPY.config.initial_card;
    var nextCard = document.getElementById(cardID);
    if (nextCard) {
        if (active) active.classList.remove('active');
        nextCard.classList.add('active');
        setTimeout(function() { window.scrollTo(0, 0);}, 1);
        active = nextCard;
        ANALYTICS.trackEvent('navigate', cardID);
    } else {
        console.error('Route "' + cardID + '" does not exist');
        router.setRoute(COPY.config.initial_card);
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
    data['pipetype'] = active.id;

    // For some reason HTML5 email element doesn't serialize
    var email = e.target.querySelector('input[name="email"]');
    data['email'] = email.value;

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

var loadAddEventButton = function() {
    var fmt = 'MM/DD/YYYY hh:mm A';
    var start = moment().startOf('hour').add(1, 'hours');
    var end = start.clone().add(0.5, 'hours')
    var addEventButtonElement = document.getElementById('calendar-button');
    addEventButtonElement.innerHTML = JST.addeventbutton({
        start: start.format(fmt),
        end: end.format(fmt),
        license: APP_CONFIG.ADDEVENT_LICENSE_KEY
    });

    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= '//addevent.com/libs/atc/1.6.1/atc.min.js';
    script.async = true;
    document.body.appendChild(script);
    script.onload = function() {
        addeventatc.settings({
            license: APP_CONFIG.ADDEVENT_LICENSE_KEY
        });
        addeventatc.register('button-dropdown-click', function(obj){
            ANALYTICS.trackEvent('reminder', obj.service);
        });

    }
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
