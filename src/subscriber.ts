/**
 * Created by kylewill0725 on 6/20/2017.
 */
import * as fs from 'fs';
import * as _ from 'underscore';

export class SubscriberInstanceManager {
    private static _instance: SubscriberInstanceManager;
    static get INSTANCE(): SubscriberInstanceManager {
        if (typeof SubscriberInstanceManager._instance === 'object')
            return SubscriberInstanceManager._instance;
        SubscriberInstanceManager.setINSTANCE(new SubscriberInstanceManager());
        return SubscriberInstanceManager._instance;
    }
    private static setINSTANCE(instance: SubscriberInstanceManager) {
        SubscriberInstanceManager._instance = instance;
    }

    private _subscribers: Subscriber[] = [];
    get subscribers(): Subscriber[] {
        return this._subscribers.map(x => Object.assign({}, x));
    }

    add(subscriber: Subscriber): boolean {
        let result = this.subscribers.filter(val => subscriber.isEqual(val) );
        if (result.length > 0) return false;
        this._subscribers.push(subscriber);
        return true;
    }

    remove(subscriber: Subscriber): boolean {
        if (!this._subscribers.some((sub, i, array) =>  sub.isEqual( subscriber )))
            return false;
        this._subscribers = this._subscribers.filter(val => !val.isEqual(subscriber));
        return true;
    }

    removeTopic(subscriber: Subscriber, ...topics: string[]): boolean {
        let i = this.subscribers.findIndex((val, j, ar) => subscriber.sub == val.sub);
        if (i >= 0) {
            if (this.subscribers[i].topics.length > 1) {
                this._subscribers[i].topics = this.subscribers[i].topics.filter(val => topics.indexOf(val) == -1);
            } else {
                this.remove(this.subscribers[i]);
            }
            return true;
        }
        return false;
    }

    removeDesc(subscriber: string, topics: string[]): boolean {
        let i = this.subscribers.findIndex((val, j, ar) => subscriber == val.sub);
        if (i >= 0) {
            if (this.subscribers[i].topics.length > 1) {
                this._subscribers[i].topics = this.subscribers[i].topics.filter(val => topics.indexOf(val) == -1);
            } else {
                this.remove(this.subscribers[i]);
            }
            return true;
        }
        return false;
    }

    async save(location: string) {
        try {
            fs.writeFileSync(location, JSON.stringify(this.subscribers));
        } catch (err) {
            throw err;
        }
    }

    clear() {
        this._subscribers = [];
    }

    rebuild(location: string) {
        let err, data = fs.readFileSync(location, 'utf8');
        if (err) throw err;
        this._subscribers = JSON.parse(data);
    }
}

export class Subscriber {
    topics: string[];
    sub: string;

    constructor (subscription: string, topics:string[] = ["products"]) {
        this.topics = topics;
        this.sub = subscription;
    }

    isEqual(subscriber: Subscriber): boolean {
        return typeof subscriber !== 'undefined' && this.sub == subscriber.sub && this.topics.length == subscriber.topics.length && this.topics.some(val => subscriber.topics.includes(val));
    }
}