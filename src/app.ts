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
import {Product, Props} from "./product";
const index = require('./routes/index');
const users = require('./routes/users');
const keys = require('./keys');

let app = express();
const SUBSCRIBERS_LOC = 'X:\\Onedrive\\Programming Projects\\ProductTracker\\subscribers.json';
const PRODUCTS_LOC = './urls.json';

//region Setup
let sim = SubscriberInstanceManager.INSTANCE;
sim.setLoc(SUBSCRIBERS_LOC);

//Load Subscribers
if (fs.existsSync(SUBSCRIBERS_LOC))
    sim.rebuild(SUBSCRIBERS_LOC);
let subscribers = sim.subscribers;

//Load Products
const products: Product[] = [];
let err, data = fs.readFileSync(PRODUCTS_LOC, 'utf8');
if (err) throw err;
for (let val of JSON.parse(data)) {
    if (val.hasOwnProperty('href') && val['href'].includes('newegg'))
        products.push(new Product(val['name'], val['href'], onChangeState));
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
app.use('/unsubscribe', function (req, res) {
        req.query.topics.forEach(function (topic) {
            let i = subscribers.findIndex((subscriber) => subscriber.sub.endpoint == req.body.subs.endpoint);
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
    products.forEach((product, i, arr) => {
        setInterval((product) => {
            console.log("Checking: " + product.name);
            let options = {
                url: product.apiUrl,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Mobile Safari/537.36'
                }
            };
            callJSONRequest(options, (err, productInfo) => {
                if (err.code == 'ECONNRESET') {
                    return;
                }else if (err.code == 'ETIMEDOUT') {
                    console.log("No connection.");
                    return;
                } else if (err) {
                    throw err;
                }
                if (Number(productInfo.Basic.FinalPrice.match(/[0-9.]+/)[0]) < 300) {
                    product.inStock = productInfo.Basic.Instock;
                    product.canAddToCart = productInfo.Basic.CanAddToCart;
                }
            });


        }, 5000, product);
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

function onChangeState(prop: Props, product: Product) {
    sendPushNotification('product', {
        title: prop == 0 ? (product.inStock ? 'In Stock: ' : 'Out of Stock: ') + product.name :
            (product.canAddToCart ? 'Can add to cart: ' : "Can't add to cart: ") + product.name,
        url: product.url
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
            console.log(err);
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