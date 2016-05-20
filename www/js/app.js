// Global variables
var active;
var routes;
var router;
var cityReferences;
var lang = 'en';

var onDocumentLoad = function(e) {
    cityReferences = document.getElementsByClassName('geo-city');

    geoLocate();

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
    } else {
        console.error('Route "' + cardID + '" does not exist');
    }
}

var geoLocate = function() {
    // @TODO wrap in block that caches this stuff

    if (typeof geoip2 === 'object') {
        geoip2.city(onLocateIP, onLocateFail);
    }
}

var onLocateIP = function(response) {
    console.log('locate ip successful');
    console.log(response);
    for (var i = 0; i < cityReferences.length; ++i) {
        var item = cityReferences[i];
        item.innerHTML = response.city.names[lang] + ', ' + response.most_specific_subdivision.iso_code;
    }
}

var onLocateFail = function(response) {
    console.log('locate failed');
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
