/**
 * Created by kylewill0725 on 6/21/2017.
 */
import * as express from 'express'
import * as request from 'request'
import * as chromeLauncher from 'lighthouse/chrome-launcher/chrome-launcher'
import * as CDP from 'chrome-remote-interface'
import * as fs from 'fs'
import * as path from 'path'
import * as favicon from 'serve-favicon'
import * as logger from 'morgan'
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import {SubscriberInstanceManager, Subscriber} from './subscriber';
const index = require('./routes/index');
const users = require('./routes/users');
const keys = require('./keys');

let app = express();
const SUBSCRIBERS_LOC = './subscribers.json';

//region Setup
let sim = SubscriberInstanceManager.INSTANCE;
sim.setLoc(SUBSCRIBERS_LOC);

//Load Subscribers
if (fs.exists(SUBSCRIBERS_LOC))
    sim.rebuild(SUBSCRIBERS_LOC);
let subscribers = sim.subscribers;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/subscribe', function (req, res) {
        req.query.topics.forEach(function (topic) {
            sim.add(new Subscriber(req.body.sub, topic));
        });
        res.end("Success");
    }
);
app.use('/unsubscribe', function (req, res) {
        req.query.topics.forEach(function (topic) {
            let i = subscribers.findIndex((subscriber) => subscriber.sub == req.body.subs);
            if (i >= 0) {
                sim.removeTopic(subscribers[i], topic);
            }
        });
        res.end("Success");
    }
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
//endregion

//region Product Monitor
let chrome = null;
let protocol = null;

(async function () {
    chrome = await launchChrome(true);
    protocol = await CDP({port: chrome.port});
})().then(() => {
    fs.readFile('./urls.json', 'utf8', (err, data) => {
        if (err) throw err;
        let urls = JSON.parse(data);
        let amazon_urls = [];
        for (let i in urls) {
            if (urls[i].href.includes("amazon")) {
                amazon_urls.push(urls[i]);
            } else if (urls[i].href.includes("newegg")) {
                setInterval((url) => {
                    console.log("Checking: " + url.name);
                    let id = neweggIDExtractor(url.href);
                    let options = {
                        url: 'http://www.ows.newegg.com/Products.egg/' + id,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Mobile Safari/537.36'
                        }
                    };
                    callJSONRequest(options, (err, productInfo) => {
                        if (err.code == 'ECONNRESET') {
                            return;
                        } else if (err) {
                            throw err;
                        }
                        if (productInfo.Basic.Instock && (Number(productInfo.Basic.FinalPrice.replace(/[^0-9\.]+/g,"")) < 350)) {
                            console.info("In Stock: " + url.name);
                            fs.appendFileSync('log.txt', new Date() + ' Found: ' + url.name + '\n');
                            sendPushNotification('product', {
                                title: 'In Stock: ' + url.name,
                                url: url.href
                            });
                        }
                    });

                }, 5000, urls[i]);

            }
        }
        // setInterval(async (aurls) => {
        //     const {Page, Runtime} = protocol;
        //     await Promise.all([Page.enable(), Runtime.enable()]);
        //
        //     for (let i in aurls) {
        //         Page.navigate({url: aurls[i].href}).catch((err) => {
        //             console.log(err);
        //         });
        //
        //         Page.loadEventFired(async () => {
        //             console.log("Checking: "+aurls[i].name);
        //             const result = await Runtime.evaluate({expression: "document.body.innerHTML"});
        //             if (result.result.subtype !== 'null') {
        //                 console.info("In Stock" + aurls[i].name);
        //                 fs.appendFileSync('log.txt', new Date() + ' Found: ' + aurls[i].name + '\n');
        //                 sendPushNotification('product', {
        //                     title: 'In Stock: ' + aurls[i].name,
        //                     url: aurls[i].href
        //                 }).catch((err) => {
        //                     console.log(err);
        //                 });
        //             }
        //         })
        //     }
        // }, 5000, amazon_urls);
    });
});
//endregion

//region Product Monitor Functions
async function launchChrome(headless = true) {
    return await chromeLauncher.launch({
        chromeFlags: [
            '--disable-gpu',
            headless ? '--headless' : ''
        ]
    });
}

function sendPushNotification(topic, payload) {
    let wp = require('web-push');
    let options = {
        TTL: 60,
        vapidDetails: {
            subject: 'mailto:kwill1429@gmail.com',
            publicKey: keys.vapidPublicKey,
            privateKey: keys.vapidPrivateKey
        }
    };
    for (let sub of subscribers.filter(sub => sub.topics.includes(topic))) {
        wp.sendNotification(
            sub.sub,
            JSON.stringify(payload),
            options
        ).catch((err) => {

        });
    }
}

function callJSONRequest(options, onResult) {
    request(options, (err, res, body) => {
        if (err) {
            onResult(err, '');
            return;
        }
        let json = JSON.parse(body);
        onResult(0, json);
    });
}

function neweggIDExtractor(url) {
    return url.match(/Item(%3D|=)([^%]*)/)[2];
}
//endregion

module.exports = app;