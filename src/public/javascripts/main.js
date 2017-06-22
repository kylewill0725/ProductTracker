/**
 * Created by kylewill0725 on 6/18/2017.
 */
/*
 Copyright 2016 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

let app = (function() {
    'use strict';

    let isSubscribed = false;
    let swRegistration = null;

    let pushButton = document.querySelector('.subscribe');

    if (!('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        return;
    }

    Notification.requestPermission(function(status) {
        console.log('Notification permission status:', status);
    });

    function initializeUI() {
        pushButton.addEventListener('click', function() {
            pushButton.disabled = true;
            if (isSubscribed) {
                unsubscribeUser();
            } else {
                subscribeUser();
            }
        });

        // Set the initial subscription value
        swRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                isSubscribed = (subscription !== null);

                updateSubscriptionOnServer(isSubscribed, subscription);

                if (isSubscribed) {
                    console.log('User IS subscribed.');
                } else {
                    console.log('User is NOT subscribed.');
                }

                updateBtn();
            });
    }

    let applicationServerPublicKey = window.keys.vapidPublicKey;

    function subscribeUser() {
        let applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
        swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        })
            .then(function(subscription) {
                console.log('User is subscribed:', subscription);

                updateSubscriptionOnServer(true, subscription);

                isSubscribed = true;

                updateBtn();
            })
            .catch(function(err) {
                if (Notification.permission === 'denied') {
                    console.warn('Permission for notifications was denied');
                } else {
                    console.error('Failed to subscribe the user: ', err);
                }
                updateBtn();
            });
    }

    function unsubscribeUser() {
        let sub = null;
        swRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                if (subscription) {
                    if (subscription.unsubscribe()) {
                        sub = subscription;
                        return true;
                    }
                    return false;
                }
            })
            .catch(function(error) {
                console.log('Error unsubscribing', error);
            })
            .then(function() {
                updateSubscriptionOnServer(false, JSON.stringify(sub));

                console.log('User is unsubscribed');
                isSubscribed = false;

                updateBtn();
            });
    }

    function updateSubscriptionOnServer(isSub, subscription) {
        // Here's where you would send the subscription to the application server

        let subscriptionJson = document.querySelector('.js-sub');
        let endpointURL = document.querySelector('.js-end');
        let subAndEndpoint = document.querySelector('.endpoint');

        if (isSub) {
            subscriptionJson.textContent = JSON.stringify(subscription);
            endpointURL.textContent = subscription.endpoint;
            subAndEndpoint.style.display = 'block';

            let xhttp = new XMLHttpRequest();
            xhttp.open('POST', '/subscribe?topics[]=product', true);
            let blob = new Blob(['{"subs": '+JSON.stringify(subscription)+'}'], {type: 'application/json'});
            xhttp.send(blob);
        } else {
            subAndEndpoint.style.display = 'none';

            let xhttp = new XMLHttpRequest();
            xhttp.open('POST', '/unsubscribe?topics[]=product', true);
            let blob = new Blob(['{"subs": '+JSON.stringify(subscription)+'}'], {type: 'application/json'});
            xhttp.send(blob);
        }
    }

    function updateBtn() {
        if (Notification.permission === 'denied') {
            pushButton.textContent = 'Push Messaging Blocked';
            pushButton.disabled = true;
            updateSubscriptionOnServer(null);
            return;
        }

        if (isSubscribed) {
            pushButton.textContent = 'Disable Push Messaging';
        } else {
            pushButton.textContent = 'Enable Push Messaging';
        }

        pushButton.disabled = false;
    }

    function urlB64ToUint8Array(base64String) {
        let padding = '='.repeat((4 - base64String.length % 4) % 4);
        let base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        let rawData = window.atob(base64);
        let outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and Push is supported');

        navigator.serviceWorker.register('./javascripts/sw.js')
            .then(function(swReg) {
                console.log('Service Worker is registered', swReg);

                swRegistration = swReg;

                initializeUI();
            })
            .catch(function(error) {
                console.error('Service Worker Error', error);
            });
    } else {
        console.warn('Push messaging is not supported');
        pushButton.textContent = 'Push Not Supported';
    }

})();