/**
 * Created by kylewill0725 on 6/20/2017.
 */
import {Subscriber, SubscriberInstanceManager, Subscription} from '../subscriber';
import {suite, test} from 'mocha-typescript';
import * as fs from "fs";
const chai = require('chai');

let expect = chai.expect;

const save_loc = "./test.json";


@suite("Subscribers")
class SubscriberTest {

    public static before() {
        chai.should();
    }

    private sub: Subscriber;
    private subs: Subscriber[] = [];

    constructor() {
        this.sub = new Subscriber({endpoint: "Test"} as Subscription);
        for (let i = 0; i < 10; i++) {
            this.subs.push(new Subscriber({endpoint: String(i)} as Subscription));
        }
        SubscriberInstanceManager.INSTANCE.setLoc(save_loc);
    }

    @test("Test adding subscriber to subscriber list")
    public addSubscriber() {
        SubscriberInstanceManager.INSTANCE.add(this.sub).should.eq(true, '1');
        SubscriberInstanceManager.INSTANCE.add(this.sub).should.eq(false, '2');
        SubscriberInstanceManager.INSTANCE.add(new Subscriber({endpoint: "Test"} as Subscription, ["product", "rawr", "beethoven"])).should.eq(true, '3');
        SubscriberInstanceManager.INSTANCE.add(new Subscriber({endpoint: "Test"} as Subscription, ["product", "rawr"])).should.eq(false, '4');
        SubscriberInstanceManager.INSTANCE.clear();
    }

    @test("Remove subscriber")
    public removeSubscriber() {
        expect(this.sub).exist;
        SubscriberInstanceManager.INSTANCE.add(this.sub).should.eq(true);
        SubscriberInstanceManager.INSTANCE.remove(this.sub).should.eq(true);
        SubscriberInstanceManager.INSTANCE.remove(this.sub).should.eq(false);
        SubscriberInstanceManager.INSTANCE.clear();
    }

    @test("Remove subscriber description")
    public removeSubscriberDesc() {
        expect(this.sub).exist;
        SubscriberInstanceManager.INSTANCE.add(this.sub).should.eq(true, "1");
        SubscriberInstanceManager.INSTANCE.removeDesc("Test", ["product"]).should.eq(true, "2");
        SubscriberInstanceManager.INSTANCE.removeDesc("Test", ["product"]).should.eq(false, "3");
        SubscriberInstanceManager.INSTANCE.clear();
    }

    @test("Save and rebuild subscribers with valid location")
    public async saveAndRebuildSubscribers() {
        for (let i in this.subs) {
            SubscriberInstanceManager.INSTANCE.add(this.subs[i]).should.eq(true);
        }
        expect(SubscriberInstanceManager.INSTANCE.save(save_loc)).to.not.throw;
        SubscriberInstanceManager.INSTANCE.clear();
        expect(SubscriberInstanceManager.INSTANCE.rebuild(save_loc)).to.not.throw;
        SubscriberInstanceManager.INSTANCE.subscribers.should.have.lengthOf.at.least(1);
        SubscriberInstanceManager.INSTANCE.clear();
    }

    public static after() {
        fs.unlinkSync(save_loc);
    }
}
