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
    private get subscribers(): Subscriber[] {
        return this._subscribers;
    }

    add(subscriber: Subscriber): boolean {
        let existingSub = this.subscribers.filter(val => subscriber.sub.endpoint == val.sub.endpoint)[0];
        if (existingSub != null) {
            let newTopics = subscriber.topics.filter(nTopic => existingSub.topics.every(oTopic => oTopic != nTopic));
            if (newTopics.length == 0) return false;
            newTopics.forEach(topic => {
                existingSub.topics.push(topic);
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

    removeTopic(subscriber: Subscriber, topics: string[]): boolean {
        return this.removeDesc(subscriber.sub.endpoint, topics);
    }

    removeDesc(subscriber: string, topics: string[]): boolean {
        let existingSub = this.subscribers.filter(eSub => subscriber == eSub.sub.endpoint)[0];
        if (existingSub != null) {
            existingSub.topics = existingSub.topics.filter(val => topics.indexOf(val) == -1);
            if (existingSub.topics.length == 0) {
                this.remove(existingSub);
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
        this._subscribers = JSON.parse(data, Subscriber.reviver).map(val => {
            return Object.setPrototypeOf(val, Subscriber.prototype)
        });
    }

    setLoc(location: string) {
        this._location = location;
    }
}

export class Subscriber {
    constructor(public sub: Subscription = null, public topics: string[] = ["product"]) {
    }

    isEqual(subscriber: Subscriber): boolean {
        return typeof subscriber !== 'undefined' && this.sub.endpoint == subscriber.sub.endpoint;
    }

    static reviver(key: string, value: any): any {

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