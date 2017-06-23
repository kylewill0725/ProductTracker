/**
 * Created by kylewill0725 on 6/22/2017.
 */
import * as request from 'request'
import * as xpath from 'xpath';
import {DOMParser} from 'xmldom';

export enum Stores {
    NEWEGG,
    SUPERBIIZ
}

export module Stores {
    export function get(type: string): Stores {
        return Stores[type];
    }
}

export abstract class Product {
    name: string;
    url: string;
    type: Stores;
    callback: Function;

    static create(name: string, url: string, callback: Function): Product {
        let domain = URLExtractor(url).match(/([^.]+).(com|net)/)[1].toUpperCase();
        domain = domain === 'DDNS' ? 'NEWEGG' : domain;
        let type = Stores.get(domain);

        switch (type) {
            case Stores.NEWEGG: {
                return new NeweggProduct(type, name, url, callback);
            }
            case Stores.SUPERBIIZ: {
                return new SuperBiizProduct(type, name, url, callback);
            }
        }
        return null;
    }

    abstract checkStatus();
}

export class NeweggProduct extends Product {
    get canAddToCart(): boolean {
        return this._canAddToCart;
    }

    set canAddToCart(value: boolean) {
        if (value != this._canAddToCart) {
            this._canAddToCart = value;
            this.callback(this.canAddToCart ? 'Can add: ' + this.name : 'Can\'t add: ' + this.name,
                this.url);
        }
    }

    get inStock(): boolean {
        return this._inStock;
    }

    set inStock(value: boolean) {
        if (value != this._inStock) {
            this._inStock = value;
            this.callback(this.inStock ? 'In stock: ' + this.name : 'Out of stock: ' + this.name,
                this.url);
        }
    }
    readonly NEWEGG_API_URL = 'http://www.ows.newegg.com/Products.egg/';

    private _inStock: boolean = false;
    private _canAddToCart: boolean = false;
    apiUrl: string;
    id: string;

    constructor(type: Stores, name: string, url: string, onChangeCallback: Function) {
        super();
        this.type = type;
        this.name = name;
        this.id = this.neweggIDExtractor(url);
        this.url = URLExtractor(url);
        this.apiUrl = this.id !== 'testing' ? this.NEWEGG_API_URL + this.id : this.url;
        this.callback = onChangeCallback;
    }



    neweggIDExtractor(url) {
        if (url.match(/^https:\/\/producttracker/) != null) return "testing";
        return url.match(/Item(%3D|=)([^%]*)/)[2];
    }

    checkStatus() {
        console.log("Checking: " + this.name);
        let options = {
            url: this.apiUrl,
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
                this.inStock = productInfo.Basic.Instock;
                this.canAddToCart = productInfo.Basic.CanAddToCart;
            }
        });
    }
}

export class SuperBiizProduct extends Product {
    get canAddToCart(): boolean {
        return this._canAddToCart;
    }

    set canAddToCart(value: boolean) {
        if (value != this._canAddToCart) {
            this._canAddToCart = value;
            this.callback(this.canAddToCart ? 'Can add: ' + this.name : 'Can\'t add: ' + this.name,
                this.url);
        }
    }

    private _canAddToCart: boolean = false;
    apiUrl: string;
    id: string;

    constructor(type: Stores, name: string, url: string, onChangeCallback: Function) {
        super();
        this.type = type;
        this.name = name;
        this.url = URLExtractor(url);
        this.callback = onChangeCallback;
    }

    checkStatus() {
        console.log("Checking: " + this.name);
        let options = {
            url: this.url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Mobile Safari/537.36'
            }
        };
        request(options, (err, res, body) => {
            let dom = new DOMParser({errorHandler: {}}).parseFromString(body);
            let input: Element = xpath.select('//*[@value="ADD TO CART"]', dom)[0] as Element;
            if (!input) return;
            let cls = input.attributes.getNamedItem('class');
            this.canAddToCart = !(typeof cls !== 'undefined' && cls.value.includes('not_in_stock'));
        });
    }
}

function URLExtractor(url) {
    let matches = url.replace(/%2F/g, '/').replace(/%3A/g,':').replace(/%3D/g,'=').replace(/%3F/g, '?').match(/url=([^&]+)/);
    if (matches == null) return url;
    return matches[1];
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