/**
 * Created by kylewill0725 on 6/21/2017.
 */
import * as express from 'express'
import * as request from 'request'
import * as fs from 'fs'
import * as path from 'path'
import * as favicon from 'serve-favicon'
import * as morgan from 'morgan'
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import {sendNotification, WebPushError} from 'web-push';
import {SubscriberInstanceManager, Subscriber} from './subscriber';
import {Product} from "./product";
const index = require('./routes/index');
const users = require('./routes/users');
const keys = require('./keys');
import {logger} from './logger';
import {urls, manufacturers, models} from '../urls';
import {config} from '../config';
import {IncomingMessage, ServerResponse} from "http";
import {Request, Response} from "express";

class HttpError implements Error {
    name: string;
    status: number;
    constructor(public message: string){}
}

let app = express();
const SUBSCRIBERS_LOC = './subscribers.json';

//region Setup
let sim = SubscriberInstanceManager.INSTANCE;
sim.setLoc(SUBSCRIBERS_LOC);

//Load Subscribers
if (fs.existsSync(SUBSCRIBERS_LOC))
    sim.rebuild(SUBSCRIBERS_LOC);

//Load Products
const products: Product[] = [];
for (let url of urls) {
    let product = Product.create(url['name'], url['href'], onChangeState);
    if (product != null)
        products.push(product);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev')); //TODO: Compare different morgan logging levels.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/test', (req, res) => {
    sendPushNotification('test', {title: 'test'});
    res.writeHead(302, {Location: 'http://localhost:2000'});
    res.end();
});
app.use('/subscribe', (req, res) => {
        sim.add(new Subscriber(req.body.subs, req.query.topics));
        sim.add(new Subscriber(req.body.subs, ['test']));
        res.end("Success");
    }
);
app.use('/unsubscribe', (req, res) => {
        if (req.body.subs != null) {
            req.query.topics.forEach(function (topic: string) {
                let i = sim.subscribers.findIndex((subscriber: Subscriber) => subscriber.sub.endpoint == JSON.parse(req.body.subs).endpoint);
                if (i >= 0) {
                    sim.removeTopic(sim.subscribers[i], [topic]);
                }
            });
        }
        res.end("Success");
    }
);
app.use('/addFilter', (req, res) => {
    if (Number(req.header('Version')) < config.NETWORK_VERSION) {

    }
    res.status(400);
    res.end();
});
app.use('/removeFilter', (req, res) => {
    res.status(400);
    res.end();
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new HttpError('Not Found');
     err.status = 404;
    next(err);
});

// error handler
app.use(function (err: HttpError, req: Request, res: Response) {
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
    })
})();
//endregion

//region Product Monitor Functions

function onChangeState(title: string, url: string, args: any = false) {

    sendPushNotification('product', {
        title: title,
        url: url
    });
}

function sendPushNotification(topic: string, payload: any) {
    let options = {
        TTL: 60,
        gcmAPIKey: keys.gcmKey,
        vapidDetails: {
            subject: 'mailto:kwill1429@gmail.com',
            publicKey: keys.vapidPublicKey,
            privateKey: keys.vapidPrivateKey
        }
    };
    console.debug("Attempting to send message.");
    for (let sub of sim.subscribers.filter(sub => sub.topics.includes(topic))) {
        sendNotification(
            sub.sub,
            JSON.stringify(payload),
            options
        ).then(() => console.debug("Message pushed")).catch((err: WebPushError) => {
            logger.error(err);
            if (err.statusCode == 400 || (err.statusCode == 410 && err.body.includes("No such subscription")))
                sim.remove(sim.subscribers.filter(sub => sub.sub.endpoint === err.endpoint)[0] as Subscriber);
        });
    }
}
//endregion

module.exports = app;