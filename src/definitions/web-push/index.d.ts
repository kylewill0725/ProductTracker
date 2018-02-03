// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

/*~ This is the module template file. You should rename it to index.d.ts
 *~ and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ If this module has methods, declare them as functions like so.
 */
export function encrypt(publicKey: any, auth: any, payload: any): {[x: string]: any, publicKey: Buffer, salt: any, cypherText: Buffer};
export function getVapidHeaders(audience: string, subject: string, publicKey: Buffer, privateKey: Buffer, expiration?: any): any;
export function generateVAPIDKeys(): {[x: string]: any, publicKey: any, privateKey: any};
export function setGCMAPIKey(key: string): void;
export function setVapidDetails(subject: string, publicKey: Buffer, privateKey: Buffer): void;
export function generateRequestDetails(subscription: PushSubscription, payload?: string, options?: any): any;
export function sendNotification(subscription: PushSubscription, payload?: string, options?: any): Promise<any>;

export class WebPushError implements Error {
    name: string;
    message: string;
    statusCode: number;
    headers: Object;
    body: string;
    endpoint: string;
}