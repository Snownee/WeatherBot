'use strict';

var restify = require('restify');
var builder = require('botbuilder');
var weatherApi = require('./lib/weather.js');
var DateHelper = require('./DateHelper');
var weather = new weatherApi('3hmktthzvvhmh57c');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
});

// Add global LUIS recognizer to bot
var luisAppUrl = process.env.LUIS_APP_URL || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/5e4a2efc-4df4-4d9e-917e-4920a623b4b0?subscription-key=d4a759d73767450e8d5de25cf6180aa2&timezoneOffset=0&verbose=true&q=';
bot.recognizer(new builder.LuisRecognizer(luisAppUrl));

bot.dialog('weatherQuery', [
    function (session, args, next) {
        // console.log(JSON.stringify(args, null, 4));
        let dateEntities = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'builtin.datetimeV2.date')
            .concat(builder.EntityRecognizer.findAllEntities(args.intent.entities, 'builtin.datetimeV2.daterange'));
        
        if (dateEntities == '') {
            session.dialogData.days = [0, 1, 2]
        } else {
            session.dialogData.days = DateHelper.resolve(dateEntities);
            console.log(session.dialogData.days);
        }
        
        
        let locationEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'location');
        if (locationEntity) {
            next({ response: locationEntity.entity });
        } else {
            if (session.userData.cityIn) {
                next();
            } else {
                builder.Prompts.text(session, '请问你所在的城市是？');
            }
        }
    },
    function (session, results) {
        console.log(JSON.stringify(results, null, 4));
        if (results.response) {
            results.response = results.response.replace(' ', '');
        }
        if (!session.userData.cityIn) {
            session.userData.cityIn = results.response;
        }
        if (!results.response) {
            results.response = session.userData.cityIn;
        }

        console.log(session.dialogData.days);
        if (session.dialogData.days.includes(0) || session.dialogData.days.includes(1) || session.dialogData.days.includes(2)) {
            
            session.send('正在查询 %s 的天气……', results.response);
            
            weather.getWeatherDaily(results.response).then(function (data) {
                console.log(JSON.stringify(data, null, 4));
                let daily = data.results[0].daily,
                    str = (session.dialogData.days.every( element => { return ( element >= 0 && element <= 2 ) } ) ? '' : '目前仅支持今明后三天的天气查询。\n\n') + data.results[0].location.name + '的天气：',
                    days = ['今天', '明天', '后天'];
                for (let i = 0;i <= 2;i++) {
                    if (session.dialogData.days.includes(i)) {
                        daily[i].date = days[i];
                        str += format(daily[i]);
                    }
                }
                session.send(str);
                session.endDialog();
            });
        } else {
            session.send('目前仅支持今明后三天的天气查询。');
            session.endDialog();
        }
    }
]).triggerAction({
    matches: 'Weather.Query'
}).cancelAction('cancelWeatherQuery', "查询已取消。", {
    matches: /^取消/
});

function format (day) {
    return '\n\n' + day.date + '\n\n' + day.low + '°C ~ ' + day.high + '°C\n\n' + (day.text_day === day.text_night ? day.text_day : day.text_day + ' 转 ' + day.text_night);
}
