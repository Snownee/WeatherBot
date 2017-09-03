/**
 * Module denpendencies
 */
var request = require('request-promise');

var url = 'https://api.seniverse.com/v3/';

function Api (key) { this.key = key }

Api.prototype.getWeatherNow = function (location, language, unit) {
    let params = {
        key: this.key,
        location: location
    };
    
    if (language)
        params.language = language;
    if (unit)
        params.unit = unit;

    return request({
        url: url + 'weather/now.json',
        qs : params,
        json : true
    });
}

Api.prototype.getWeatherDaily = function (location, language, unit, start, days) {
    let params = {
        key: this.key,
        location: location
    };
    
    if (language)
        params.language = language;
    if (unit)
        params.unit = unit;
    if (start)
        params.start = start;
    if (days)
        params.days = days;

    return request({
        url: url + 'weather/daily.json',
        qs : params,
        json : true
    });
}

module.exports = Api;
