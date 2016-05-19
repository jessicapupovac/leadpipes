// Global variables
var active;
var routes;
var router;

var onDocumentLoad = function(e) {
    var routes = {
        '/:cardID': navigateToCard
    }
    router = Router(routes);
    router.init([COPY.content.initial_card]);
}

var navigateToCard = function(cardID) {
    if (active) {
        active.classList.remove('active');
    }
    var nextCard = document.getElementById(cardID);
    nextCard.classList.add('active');
    active = nextCard;
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
