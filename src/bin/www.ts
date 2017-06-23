/**
 * Created by kylewill0725 on 6/21/2017.
 */
'use strict';

const express = require('express');
const http = require('http');

// returns an instance of node-greenlock with additional helper methods
const lex = require('greenlock-express').create({
    // set to https://acme-v01.api.letsencrypt.org/directory in production
    server: 'https://acme-v01.api.letsencrypt.org/directory'

// If you wish to replace the default plugins, you may do so here
//
    , challenges: { 'http-01': require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' }) }
    , store: require('le-store-certbot').create({ webrootPath: '/tmp/acme-challenges' })

// You probably wouldn't need to replace the default sni handler
// See https://git.daplie.com/Daplie/le-sni-auto if you think you do
//, sni: require('le-sni-auto').create({})

    , approveDomains: approveDomains
});

function approveDomains(opts, certs, cb) {
    // This is where you check your database and associated
    // email addresses with domains and agreements and such


    // The domains being approved for the first time are listed in opts.domains
    // Certs being renewed are listed in certs.altnames
    if (certs) {
        opts.domains = certs.altnames;
    }
    else {
        opts.domains = ['producttracker.ddns.net'];
        opts.email = 'kwill1429@gmail.com';
        opts.agreeTos = true;
    }

    // NOTE: you can also change other options such as `challengeType` and `challenge`
    // opts.challengeType = 'http-01';
    // opts.challenge = require('le-challenge-fs').create({});

    cb(null, { options: opts, certs: certs });
}

// handles acme-challenge and redirects to https
require('http').createServer(lex.middleware(require('redirect-https')())).listen(2002, function () { //TODO Change back to 2000
    console.log("Listening for ACME http-01 challenges on", this.address());
});



let app = require('../app');


// handles your app
require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(2003, function () {
    console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
});
