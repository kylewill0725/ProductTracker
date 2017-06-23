/**
 * Created by kylewill0725 on 6/20/2017.
 */
import * as fs from 'fs';

export class SubscriberInstanceManager {
    private _location: string;
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
        return this._subscribers.map(x => Object.assign(new Subscriber, x));
    }

    add(subscriber: Subscriber): boolean {
        let subIndex = this.subscribers.findIndex(val => subscriber.sub.endpoint == val.sub.endpoint);
        if (subIndex >= 0) {
            let newTopics = this.subscribers[subIndex].topics.concat(subscriber.topics).filter(val => !this.subscribers[subIndex].topics.includes(val));
            if (newTopics.length == 0) return false;
            newTopics.forEach(topic => {
                this._subscribers[subIndex].topics.push(topic);
            });
        } else {
            this._subscribers.push(subscriber);
        }

        this.save(this._location);
        return true;
    }

    remove(subscriber: Subscriber): boolean {
        if (!this.subscribers.some((sub: Subscriber, i, array) => sub.isEqual(subscriber)))
            return false;
        this._subscribers = this._subscribers.filter(val => !val.isEqual(subscriber));
        this.save(this._location);
        return true;
    }

    removeTopic(subscriber: Subscriber, ...topics: string[]): boolean {
        return this.removeDesc(subscriber.sub.endpoint, topics);
    }

    removeDesc(subscriber: string, topics: string[]): boolean {
        let i = this.subscribers.findIndex((val, j, ar) => subscriber == val.sub.endpoint);
        if (i >= 0) {
            if (this.subscribers[i].topics.length > 1) {
                this._subscribers[i].topics = this.subscribers[i].topics.filter(val => topics.indexOf(val) == -1);
            } else {
                this.remove(this.subscribers[i]);
            }
            this.save(this._location);
            return true;
        }
        return false;
    }

    save(location: string) {
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
        this._subscribers = JSON.parse(data).map(val => {
            return Object.setPrototypeOf(val, Subscriber.prototype)
        });
    }

    setLoc(location: string) {
        this._location = location;
    }
}

export class Subscriber {
    topics: string[];
    sub: Subscription;

    constructor(subscription: Subscription = {} as Subscription, topics: string[] = ["product"]) {

        this.topics = topics;
        this.sub = subscription;
    }

    isEqual(subscriber: Subscriber): boolean {
        return typeof subscriber !== 'undefined' && this.sub.endpoint == subscriber.sub.endpoint;
    }

}

export class Subscription {
    endpoint: string;
    expirationTime: string;
    keys = {
        auth: null,
        p256hd: null
    };

    constructor(val: object) {
        this.endpoint = val['endpoint'];
        this.expirationTime = val['expirationTime'];
        this.keys.auth = val['keys']['auth'];
        this.keys.p256hd = val['keys']['p256hd'];
    }
}