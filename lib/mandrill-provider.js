var http = require('http');
var https = require('https');

module.exports = MandrillProvider;

/**
 * Creates an instance of the Mandrill email provider.
 *
 * @constructor
 * @this {MandrillProvider}
 * @param {string} apiKey API Key for the Mandrill account.
 * @param {object} [options] Additional optional configuration.
 * @param {string} [options.async=false] See 'async' field: {@link https://mandrillapp.com/api/docs/messages.html#method-send}
 * @param {string} [options.ipPool] See: {@link http://help.mandrill.com/entries/24182062}
 * @param {boolean} [options.apiSecure=true] API connection protocol - true = HTTPS, false = HTTP
 * @param {string} [options.apiHostname=mandrillapp.com] Hostname for the API connection
 * @param {number} [options.apiPort] Port for the API connection - defaults to match the protocol (HTTPS-443, HTTP-80)
 */
function MandrillProvider(apiKey, options) {
	if (typeof apiKey !== 'string') {
		throw new Error('Invalid parameters');
	}

	options = options || {};
	options.async = options.async || false;
	options.apiSecure = options.apiSecure || true;
	options.apiHostname = options.apiHostname || 'mandrillapp.com';
	options.apiPort = options.apiPort || (options.apiSecure ? 443 : 80);

	this.apiKey = apiKey;
	this.options = options;
}

/**
 * Indicates the outcome of a mail-sending attempt.
 * @callback MandrillProvider~onResult
 * @param {error} [error] A non-null value indicates failure.
 */

/**
 * Attempts to send the message through the Mandrill API.
 *
 * @this {MandrillProvider}
 * @param {Message} message The message to send.
 * @param {MandrillProvider~onResult} [callback] Notified when the attempt fails or succeeds.
 */
MandrillProvider.prototype.mail = function (message, callback) {
	var messageObj;

	// this can fail if the message is invalid
	try {
		messageObj = this._objectForMessage(message);
	} catch (error) {
		if (callback)
			callback(error);

		return;
	}

	var requestObj = {
		'key': this.apiKey,
		'message': messageObj,
		'async': this.options.async
	};

	if (this.options.ipPool)
		requestObj['ip_pool'] = this.options.ipPool;

	var postData = JSON.stringify(requestObj);

	var options = {
		hostname: this.options.apiHostname,
		port: this.options.apiPort,
		path: '/api/1.0/messages/send.json',
		method: 'POST',

		headers: {
			'Content-Type': 'application/json',
			'Content-Length': postData.length
		}
	};

	var protocol = this.options.apiSecure ? https : http;

	var request = protocol.request(options);

	request.write(postData);
	request.end();

	// if no callback, the outcome doesn't matter
	if (!callback)
		return;

	request.on('error', function (error) {
		callback(error);
	});

	request.on('response', function (response) {
		if (response.statusCode == 200) {
			callback();
			return;
		}

		var body = '';

		response.on('data', function (chunk) {
			body += chunk;
		});

		response.on('end', function (chunk) {
			var error = new Error('Email could not be sent');

			error.httpStatusCode = response.statusCode;
			error.httpResponseData = body;

			callback(error);
		});
	});
}

MandrillProvider.prototype._objectForMessage = function (message) {
	message = message || {};
	message.to = message.to || [];
	message.cc = message.cc || [];
	message.bcc = message.bcc || [];

	// mandrill will return a 400 error if these are missing
	if (!message.from.length
		|| !message.to.length
		|| !message.subject
		|| (!message.textBody && !message.htmlBody)) {
		throw new Error('Invalid parameters');
	}

	var recipients = [];

	for (var i = 0; i < message.to.length; i++) {
		recipients.push({ type: 'to', email: message.to[i] });
	};

	for (var i = 0; i < message.cc.length; i++) {
		recipients.push({ type: 'cc', email: message.cc[i] });
	};

	for (var i = 0; i < message.bcc.length; i++) {
		recipients.push({ type: 'bcc', email: message.bcc[i] });
	};

	var obj = {
		'from_email': message.from,
		'to': recipients,
		'subject': message.subject,
		'headers': {}
	};

	if (message.replyto)
		obj['headers']['Reply-To'] = message.replyto;

	if (message.textBody)
		obj['text'] = message.textBody;

	if (message.htmlBody)
		obj['html'] = message.htmlBody;

	// todo: attachment support

	return obj;
}
