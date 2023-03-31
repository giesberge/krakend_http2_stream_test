// Copyright 2018 Google LLC.
// SPDX-License-Identifier: Apache-2.0

const express = require('express');
const http2Express = require('http2-express-bridge')
const http2 = require("http2");
// import http2 from 'http2'
const fs = require("fs");
const app = http2Express(express)
const receivers = new Map();
var cors = require('cors')
app.use(cors())
app.set('query parser', 'simple');

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});

app.post('/send', (req, res) => {
  console.log("Send endpoint requested")
  const channel = req.query.channel;
  if (!channel) {
    res.status(400).send('No channel given');
    return;
  }
  
  res.status(200);
  
  req.on('data', (chunk) => {
    const set = receivers.get(channel);
    if (!set) return;
    for (const res of set) res.write(chunk);
  });
  
  req.on('end', (chunk) => {
    if (res.writableEnded) return;
    res.send('Ended');
  });
});

app.get('/receive', (req, res) => {
  const channel = req.query.channel;
  if (!channel) {
    res.status(400).send('No channel given');
    return;
  }
  
  if (!receivers.has(channel)) {
    receivers.set(channel, new Set());
  }
  
  receivers.get(channel).add(res);
  
  res.on('close', () => {
    const set = receivers.get(channel);
    set.delete(res);
    if (set.size === 0) receivers.delete(channel);
  });
  
  res.status(200);
  res.set('Content-Type', 'text/plain');
});

app.use(express.static('static'));

// const listener = app.listen(8080, function() {
//   console.log('Your app is listening on port ' + listener.address().port);
// });

http2
  .createSecureServer(
		// Provide the private and public key to the server by reading each
		// file's content with the readFileSync() method.
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
      allowHTTP1: false
    },
    app
  )
  .listen(8080, () => {
    console.log("server is running at port 8080 with http2");
  });