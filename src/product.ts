/**
 * Created by kylewill0725 on 6/22/2017.
 */
export class Product {
    inStock: boolean = false;
    canAddToCart: boolean = false;
    url: string;
    id: string;

    constructor(id: string, url: string) {
        this.id = id;
        this.url = url;
    }
}