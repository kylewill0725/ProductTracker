/**
 * Created by kylewill0725 on 6/21/2017.
 */
'use strict';

const express = require('express');
const http = require('http');

let app = require('../app');

require('http').createServer(app).listen(2000, function () { //TODO Change back to 2000
    console.log("Listening for ACME http-01 challenges on", this.address());
});

