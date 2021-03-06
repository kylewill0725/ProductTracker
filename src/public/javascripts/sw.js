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
(function() {
    'use strict';

    let url;

    self.addEventListener('notificationclose', function(e) {
        let notification = e.notification;
        let primaryKey = notification.data.primaryKey;

        console.log('Closed notification: ' + primaryKey);
    });

    self.addEventListener('notificationclick', function(e) {
        let notification = e.notification;
        let primaryKey = notification.data.primaryKey;
        let action = e.action;

        if (action === 'close') {
            notification.close();
        } else {
            e.waitUntil(
                clients.matchAll().then(function(clis) {
                    let client = clis.find(function(c) {
                        return c.visibilityState === 'visible';
                    });
                    if (client !== undefined) {
                        client.navigate(url);
                        client.focus();
                    } else {
                        // there are no visible windows. Open one.
                        clients.openWindow(url);
                        notification.close();
                    }
                })
            );
        }

        self.registration.getNotifications().then(function(notifications) {
            notifications.forEach(function(notification) {
                notification.close();
            });
        });
    });

    self.addEventListener('push', function(e) {
        let body;
        if (e.data) {
            body = JSON.parse(e.data.text()).title;
            url = JSON.parse(e.data.text()).url;
        } else {
            body = 'Default body';
        }

        let options = {
            body: body,
            icon: '/pt/images/notification-flat.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            },
            actions: [
                {action: 'explore', title: 'Go to the site',
                    icon: '/pt/images/checkmark.png'},
                {action: 'close', title: 'Close the notification',
                    icon: '/pt/images/xmark.png'},
            ]
        };
        e.waitUntil(
            clients.matchAll().then(function(c) {
                console.log(c);
                // if (c.length === 0) {
                    // Show notification
                    self.registration.showNotification('Push Notification', options);
                // } else {
                    // Send a message to the page to update the UI
                    // console.log('Application is already open!');
                // }
            })
        );
    });

})();