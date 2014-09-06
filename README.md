# resilient-mailer-mandrill

`resilient-mailer-mandrill` implements Mandrill as an email provider for
[`resilient-mailer`](https://github.com/billinghamj/resilient-mailer).

[![NPM Version](https://img.shields.io/npm/v/resilient-mailer-mandrill.svg?style=flat)](https://www.npmjs.org/package/resilient-mailer-mandrill)
[![Build Status](https://img.shields.io/travis/billinghamj/resilient-mailer-mandrill.svg?style=flat)](https://travis-ci.org/billinghamj/resilient-mailer-mandrill)
[![Coverage Status](https://img.shields.io/coveralls/billinghamj/resilient-mailer-mandrill.svg?style=flat)](https://coveralls.io/r/billinghamj/resilient-mailer-mandrill)

```js
var MandrillProvider = require('resilient-mailer-mandrill');

var mandrill = new MandrillProvider('MyApiKey');

var mailer; // ResilientMailer instance
mailer.registerProvider(mandrill);
```

## Installation

```bash
$ npm install resilient-mailer-mandrill
```

## Usage

Create an instance of the provider. There are also a number of options you can
alter:

```js
var MandrillProvider = require('resilient-mailer-mandrill');

var options = {
	ipPool: '192.0.2.23',     // see: http://help.mandrill.com/entries/24182062
	async: true,              // see 'async' field: https://mandrillapp.com/api/docs/messages.html#method-send
	apiSecure: false,         // allows the use of HTTP rather than HTTPS
	apiHostname: '127.0.0.1', // allows alternative hostname
	apiPort: 8080             // allows unusual ports
};

var mandrill = new MandrillProvider('MyApiKey', options);
```

To register the provider with your `ResilientMailer` instance:

```js
var mailer; // ResilientMailer instance
mailer.registerProvider(mandrill);
```

In the event that you want to use `MandrillProvider` directly (rather than the
usual way - via `ResilientMailer`):

```js
var message = {
	from: 'no-reply@example.com',
	to: ['user@example.net'],
	subject: 'Testing my new email provider',
	textBody: 'Seems to be working!',
	htmlBody: '<p>Seems to be working!</p>'
};

mandrill.send(message, function (error) {
	if (!error)
		console.log('Success! The message sent successfully.');

	else
		console.log('Message sending failed - ' + error.message);
});
```

To see everything available in the `message` object, refer to
[resilient-mailer](https://github.com/billinghamj/resilient-mailer).

## Testing

Install the development dependencies first:

```bash
$ npm install
```

Then the tests:

```bash
$ npm test
```

## Support

Please open an issue on this repository.

## Authors

- James Billingham <james@jamesbillingham.com>

## License

MIT licensed - see [LICENSE](LICENSE) file
