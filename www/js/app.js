var active;
var routes;
var router;

var onDocumentLoad = function(e) {
    active = document.querySelectorAll('.card.active')[0];

    var routes = {
      '/:cardID': navigateToCard
    }
    router = Router(routes);
    router.init();
}

var navigateToCard = function(cardID) {
    var nextCard = document.getElementById(cardID);
    active.classList.remove('active');
    nextCard.classList.add('active');
    active = nextCard;
    // @TODO ADD ANALYTICS STUFF
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
