var STORAGE = (function() {
    var set = function(key, value, ttl) {
        options = {};
        //if (ttl) options.TTL = ttl;
        return simpleStorage.set(APP_CONFIG.PROJECT_SLUG + '-' + key, value, options);
    }

    var get = function(key) {
        var value = simpleStorage.get(APP_CONFIG.PROJECT_SLUG + '-' + key);
        return value;
    }

    var deleteKey = function(key) {
        return simpleStorage.deleteKey(APP_CONFIG.PROJECT_SLUG + '-' + key);
    }

    var setTTL = function(key, ttl) {
        return simpleStorage.setTTL(APP_CONFIG.PROJECT_SLUG + '-' + key, ttl)
    }

    var getTTL = function(key) {
        return simpleStorage.getTTL(APP_CONFIG.PROJECT_SLUG + '-' + key);
    }

    return {
        'set': set,
        'get': get,
        'deleteKey': deleteKey,
        'setTTL': setTTL,
        'getTTL': getTTL
    }
}());
