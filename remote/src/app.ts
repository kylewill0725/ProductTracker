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
import {Product} from "./product";
const index = require('./routes/index');
const users = require('./routes/users');
const keys = require('./keys');
import * as ptlogger from './logger';

let app = express();
const SUBSCRIBERS_LOC = './subscribers.json';
const PRODUCTS_LOC = './urls.json';

//region Setup
let sim = SubscriberInstanceManager.INSTANCE;
sim.setLoc(SUBSCRIBERS_LOC);

//Load Subscribers
if (fs.existsSync(SUBSCRIBERS_LOC))
    sim.rebuild(SUBSCRIBERS_LOC);

//Load Products
const products: Product[] = [];
let err, data = fs.readFileSync(PRODUCTS_LOC, 'utf8');
if (err) throw err;
for (let val of JSON.parse(data)) {
    let product = Product.create(val['name'], val['href'], onChangeState);
    if (product != null)
        products.push(product);
}

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
            sim.add(new Subscriber(req.body.subs, topic));
        });
        res.end("Success");
    }
);

app.user('/test', (req, res) => {
    sendPushNotification('test', 'test');
});

app.use('/unsubscribe', function (req, res) {
        req.query.topics.forEach(function (topic) {
            let i = sim.subscribers.findIndex((subscriber) => subscriber.sub.endpoint == req.body.subs.endpoint);
            if (i >= 0) {
                sim.removeTopic(sim.subscribers[i], topic);
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
(() => {
    products.forEach((product, i, arr) => {
        setInterval((product: Product) => {
            product.checkStatus();
        }, 10000, product);
    });
});//();
//endregion

//region Product Monitor Functions

function onChangeState(title: string, url: string) {
    sendPushNotification('product', {
        title: title,
        url: url
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
    for (let sub of sim.subscribers.filter(sub => sub.topics.includes(topic))) {
        wp.sendNotification(
            sub.sub,
            JSON.stringify(payload),
            options
        ).catch((err) => {
            ptlogger.log(err);
            if (err.statusCode == 410 && err.body.includes("NotRegistered"))
                sim.remove(sim.subscribers.filter(sub => sub.sub.endpoint === err.endpoint)[0] as Subscriber);
        });
    }
}
//endregion

module.exports = app;