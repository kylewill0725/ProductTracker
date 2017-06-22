/**
 * Created by kylewill0725 on 6/22/2017.
 */
export enum Props {
    InStock,
    AddToCart
}

export class Product {
    get canAddToCart(): boolean {
        return this._canAddToCart;
    }

    set canAddToCart(value: boolean) {
        if (value != this._canAddToCart) {
            this._canAddToCart = value;
            this.onChange(Props.AddToCart, this);
        }
    }

    get inStock(): boolean {
        return this._inStock;
    }

    set inStock(value: boolean) {
        if (value != this._inStock) {
            this._inStock = value;
            this.onChange(Props.InStock, this);
        }
    }
    get NEWEGG_API_URL() { return 'http://www.ows.newegg.com/Products.egg/'; }

    private _inStock: boolean = false;
    private _canAddToCart: boolean = false;
    name: string;
    apiUrl: string;
    url: string;
    id: string;
    onChange: Function;

    constructor(name: string, url: string, onChangeCallback: Function) {
        this.name = name;
        this.id = this.neweggIDExtractor(url);
        this.url = this.neweggURLExtractor(url);
        this.apiUrl = this.NEWEGG_API_URL + this.id;
        this.onChange = onChangeCallback;
    }



    neweggIDExtractor(url) {
        return url.match(/Item(%3D|=)([^%]*)/)[2];
    }

    neweggURLExtractor(url) {
        let matches = url.replace(/%2F/g, '/').replace(/%3A/g,':').replace(/%3D/g,'=').replace(/%3F/g, '?').match(/url=([^&]+)/);
        return matches[1];
    }
}