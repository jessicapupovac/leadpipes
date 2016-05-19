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
    var nextCard = document.getElementById(cardID);
    if (active) active.classList.remove('active');
    nextCard.classList.add('active');
    active = nextCard;
    // @TODO ADD ANALYTICS STUFF
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
