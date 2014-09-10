courage.js
==========

JavaScript client for Courage using WebSockets.


Basic Usage
-----------

Create a client:

```js
var dsn = 'sessionid:sessionkey@rt.thenewtricks.com:9090/928308cd-eff8-4ef6-a154-f8268ec663d5';
var courage = new TheNewTricks.Courage.Client(dsn);
```

Bind a callback function to a channel:

```js
courage.bind('791f011e-7d16-4614-9e2f-1b28db45b7b3', function(data) {

  var decoder = new TextDecoder('utf-8');
  var json = decoder.decode(data);

  var object = JSON.parse(json);

  console.log(object);
});
```

The above code decodes the binary data into a UTF-8 string, and parses a JSON object from it.


### Requirements

- All JavaScript source files are required. It is expected that you will concatenate, uglify, and minimize on your own.
- We aim to support the following browsers:
  - The latest version of Chrome
  - The latest version of Firefox
  - IE 10 and 11
  - Safari 6 and 7
- A [polyfill](https://github.com/inexorabletash/text-encoding) for TextEncoding and TextDecoding is required.


### The DSN

The Courage client is initialized with a DSN, a string that encodes the configuration information for the client. It contains:

- Authorization public key (`username`)
- Authorization private key (`password`)
- Service hostname (`host`)
- Service port (`port`)
- The provider id of the provider we are interested in (`providerId`)

The DSN is structured as follows:

    {username}:{password}@{host}:{port}/{providerId}

Here is an example:

    sessionid:sessionkey@rt.thenewtricks.com:9090/928308cd-eff8-4ef6-a154-f8268ec663d5

Currently, only one provider id per connection is supported.

Notes
-----

#### Typed Arrays

[Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) are used extensively throughout this project. They're not for performance though: almost every API in this project uses typed arrays:
 - `WebSocket`
 - `crypto.getRandomBytes`
 - `TextEncoder`
 - `TextDecoder`

 Converting these typed arrays to plain JS arrays and back all the time is silly and inefficient, so typed arrays abound!

#### `Uint8Array`s

Related to the above, the default view on an `ArrayBuffer` is a `Uint8Array`. Not only is this the specific subtype used by `TextEncoder`, it also just makes sense for a network-oriented module like ours since network data is all octets.
