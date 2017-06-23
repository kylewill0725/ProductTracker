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

let app = express();
const SUBSCRIBERS_LOC = 'X:\\Onedrive\\Programming Projects\\ProductTracker\\subscribers.json';
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
app.use('/test_newegg', function (req, res) {
    res.end(JSON.stringify({"Basic":{"ProductStockType":-1,"CanAddToCart":false,"CanPreorder":false,"AddToCartText":"Out Of Stock","IsFeaturedItem":false,"CanAddToWishList":false,"IsFirstFromAsia":false,"CanGuestCheckout":true,"ItemType":0,"ItemNumber":"14-126-196","NeweggItemNumber":"N82E16814126196","ParentItemNumber":"","Title":"ASUS Radeon RX 580 O4G Dual-fan OC Edition GDDR5 DP HDMI DVI VR Ready AMD Graphics Card (DUAL-RX580-O4G)","PromotionText":null,"PromotionInfo":null,"OriginalPrice":"","FinalPrice":"$249.99","MappingFinalPrice":"","SavingText":"","ShippingText":"$4.99 Shipping","IsFreeShipping":false,"RebateText":"This item is currently out of stock and it may or may not be restocked.","ItemMapPriceMarkType":0,"Instock":true,"ReviewSummary":{"Rating":4,"TotalReviews":"4","DisplayType":0,"Text":null},"IsHot":false,"SellerInfo":null,"SellerCount":0,"ItemBrand":{"Code":0,"BrandId":1315,"Description":"ASUS","ManufactoryWeb":"http://www.asus.com/","WebSiteURL":null,"HasManfactoryLogo":true,"BrandImage":"https://c1.neweggimages.com/brandimage//Brand1315.gif"},"ItemImages":[{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V01.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V01.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V01.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V01.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V01.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V01.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V01.jpg"},{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V03.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V03.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V03.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V03.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V03.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V03.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V03.jpg"},{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V06.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V06.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V06.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V06.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V06.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V06.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V06.jpg"},{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V02.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V02.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V02.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V02.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V02.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V02.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V02.jpg"},{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V04.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V04.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V04.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V04.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V04.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V04.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V04.jpg"},{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V05.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V05.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V05.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V05.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V05.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V05.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V05.jpg"}],"EggPointInfo":null,"IsPremierItem":false,"BulletDescription":[],"DataSource":"","SubCategoryID":0},"Additional":{"IsShellShockerItem":false,"CanPriceAlert":false,"LimitQuantity":1,"Warnings":null,"FreeGifts":null,"VolumeDiscounts":null,"ProductProperties":null,"Category":{"SubCategoryId":48,"SubCategoryName":"Desktop Graphics Cards"},"MailInRebates":null,"Model":"DUAL-RX580-O4G","EmailFriendImageInfo":{"ItemNumber":null,"Title":null,"FullPath":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V01.jpg","ThumbnailImagePath":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V01.jpg","SmallImagePath":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V01.jpg","PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V01.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V01.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V01.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V01.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V01.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V01.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V01.jpg"},"ShippingHelp":{"Summry":"Shipping Restrictions","Content":" Additional fees may apply for shipments to APO/FPO, AK, HI and PR."},"IronEgg":null,"StockDescription":"OUT OF STOCK","PromotionCode":null,"BulletDescription":["4GB 256-Bit GDDR5 ","Boost Clock 1380 MHz (OC Mode)\n1360 MHz (Gaming Mode) ","1 x DVI-D 1 x HDMI 2.0 1 x DisplayPort ","2304 Stream Processors"],"StoreNavigation":{"ShowSeeAllDeals":false,"CustomLink":"","LinkParams":null,"Description":"Desktop Graphics Cards","StoreType":2,"CategoryId":-1,"StoreId":-1,"SubCategoryId":48,"BrandId":-1,"NValue":"100007709","ItemCount":0,"NodeId":-1,"Keyword":"","ProductTypes":0,"PMSubList":null},"IsMobileExclusiveDeal":false,"ShippingInfo":{"IsShipByNewegg":true,"ShipFromCountryName":null,"ShippingNote":null},"SpecialOffersInfo":null},"ContainComboDeals":false,"ShoppingInsight":null,"CoremetricsInfo":null,"CrossTable":{"DriveSavers":null,"ExtendedWarranties":[{"GroupName":"(ST) VGA","GroupDescription":"100% parts and labor, no deductibles or hidden fees. 5-day service guarantee upon depot arrival. 24/7 customer support. ","ExtendedWarranties":[{"Image":{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V01.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V01.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V01.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V01.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V01.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V01.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V01.jpg"},"ItemNumber":"SNET-66000597","Description":"3 Year VGA Protection Plan                                                                                                                                                                              ","Years":3,"PreSelected":false,"FinalPrice":"$29.99","OriginalPrice":"","SavingText":null,"PopMessage":"<ul><li> 100% parts and labor, no deductibles or hidden fees</li> <li>5-day service guarantee upon depot arrival</li><li>24/7 customer support</li></ul>"},{"Image":{"ItemNumber":null,"Title":null,"FullPath":null,"ThumbnailImagePath":null,"SmallImagePath":null,"PathSize35":"https://c1.neweggimages.com/ProductImageCompressAll35/14-126-196-V01.jpg","PathSize60":"https://c1.neweggimages.com/ProductImageCompressAll/14-126-196-V01.jpg","PathSize100":"https://c1.neweggimages.com/ProductImageCompressAll100/14-126-196-V01.jpg","PathSize125":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll125/14-126-196-V01.jpg","PathSize180":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll200/14-126-196-V01.jpg","PathSize300":"https://c1.neweggimages.com/NeweggImage/ProductImageCompressAll300/14-126-196-V01.jpg","PathSize640":"https://c1.neweggimages.com/NeweggImage/productimage/14-126-196-V01.jpg"},"ItemNumber":"SNET-66000614","Description":"4 Year VGA Protection Plan                                                                                                                                                                              ","Years":4,"PreSelected":false,"FinalPrice":"$44.99","OriginalPrice":"","SavingText":null,"PopMessage":"<ul><li> 100% parts and labor, no deductibles or hidden fees</li> <li>5-day service guarantee upon depot arrival</li><li>24/7 customer support</li></ul>"}]}],"ManufactureService":null},"Similar":null,"ReturnPolicy":{"Name":"Replacement Only Return Policy","ID":"80","HtmlContent":"","IsSeller":false},"HideFeedBack":false,"SuggestSimilarContent":null,"BuzzInfo":{"TopFavorable":{"BoughtTimeTypeInt":3,"TechLevelTypeInt":0,"reviewID":4964405,"Title":"Great product .. easy set up and use!!!","Rating":5,"PublishDate":"6/1/2017 11:06:27 AM","LoginNickName":"eric p.","BoughtTimeTypeString":"1 week to 1 month","TechLevelTypeString":"","IsNewReview":true,"PurchaseMark":true,"Cons":"nothing","Pros":"Quiet fan good shape (small) and easy to handle!","Comments":"Highly recommand this prod!","TotalConsented":1,"TotalVoting":1},"TopCritical":{"BoughtTimeTypeInt":4,"TechLevelTypeInt":0,"reviewID":4975576,"Title":"Cheap Quality, Runs Hot","Rating":2,"PublishDate":"6/19/2017 7:41:22 AM","LoginNickName":"James C.","BoughtTimeTypeString":"1 month to 1 year","TechLevelTypeString":"","IsNewReview":true,"PurchaseMark":true,"Cons":"-Runs to hot under high usage. Which means having to run the fans to high which will burn them out and/or undervolting/underclock to decrease heat and loosing performance.\n-Weak Memory (The 480s could handle more overclocking by 75-100 MHz)\n-Cheap construction, you can actually flex the insides of this card by applying a bit of pressure to it. It's not solidly made. The material used is also cheaper from the 480s construction.","Pros":"-Does the Job \n-Fans are quiet","Comments":"I bought a bunch of these because I was so impressed with the Dual 480s, what a mistake! I don't like negative reviews without solutions. I recommend the PowerColor Red Dragon 4G model, It runs well under pressure, its sturdy and has great heat distribution. But to be fair any other 580 is probably better than this one! I have tried Asus, Power Color and XFX.","TotalConsented":1,"TotalVoting":1}},"KitMakerInfo":null,"NewerVersion":null}));
});
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
let chrome = null;
let protocol = null;

(async function () {
    chrome = await launchChrome(true);
    protocol = await CDP({port: chrome.port});
})().then(() => {
    products.forEach((product, i, arr) => {
        setInterval((product: Product) => {
            product.checkStatus();
        }, 10000, product);
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
            console.log(err);
            if (err.statusCode == 410 && err.body.includes("NotRegistered"))
                sim.remove(sim.subscribers.filter(sub => sub.sub.endpoint === err.endpoint)[0] as Subscriber);
        });
    }
}

function neweggIDExtractor(url) {
    return url.match(/Item(%3D|=)([^%]*)/)[2];
}
//endregion

module.exports = app;