var test = require('tape');
var http = require('http');
var MandrillProvider = require('../lib/mandrill-provider');

test('correct types exported', function (t) {
	t.equal(typeof MandrillProvider, 'function');
	t.equal(typeof MandrillProvider.prototype.mail, 'function');

	t.end();
});

test('correct types after initialization', function (t) {
	var provider = new MandrillProvider('api-key');

	t.assert(provider instanceof MandrillProvider);
	t.equal(typeof provider.mail, 'function');

	t.end();
});

test('invalid initialization causes exception', function (t) {
	t.throws(function () { new MandrillProvider(); });
	t.throws(function () { new MandrillProvider(0); });
	t.throws(function () { new MandrillProvider({}); });
	t.throws(function () { new MandrillProvider([]); });

	t.end();
});

test('empty options doesn\'t cause exception', function (t) {
	t.doesNotThrow(function () { new MandrillProvider('api-key', {}); });

	t.end();
});

test('invalid message returns error', function (t) {
	var provider = new MandrillProvider('api-key');

	t.plan(3);

	provider.mail(null, function (error) { t.notEqual(typeof error, 'undefined'); });
	provider.mail({}, function (error) { t.notEqual(typeof error, 'undefined'); });
	provider.mail({to:['']}, function (error) { t.notEqual(typeof error, 'undefined'); });
});

test('api used correctly when successful', function (t) {
	var apiKey = 'CuKLNA-awa4skvmqOWTHtCF'; // arbitrary
	var ipPool = '192.0.2.23';

	var message = {
		from: 'no-reply@example.com',
		to: ['user@example.net', 'user@example.org'],
		cc: ['user2@example.net'],
		bcc: ['user3@example.net'],
		replyto: 'info@example.com',
		subject: 'testing, 123...',
		textBody: 'please disregard',
		htmlBody: '<p>please disregard</p>'
	};

	var expectedObject = {
		'key': apiKey,
		'async': false,
		'ip_pool': ipPool,

		'message': {
			'from_email': 'no-reply@example.com',
			'to': [
				{ 'type': 'to', 'email': 'user@example.net' },
				{ 'type': 'to', 'email': 'user@example.org' },
				{ 'type': 'cc', 'email': 'user2@example.net' },
				{ 'type': 'bcc', 'email': 'user3@example.net' }
			],
			'subject': 'testing, 123...',
			'headers': { 'Reply-To': 'info@example.com' },
			'text': 'please disregard',
			'html': '<p>please disregard</p>'
		}
	};

	t.plan(6);

	var server = setupTestServer(t,
		function (request, response, body) {
			t.equal(body.length, parseInt(request.headers['content-length']));

			t.deepEqual(JSON.parse(body), expectedObject);

			response.writeHead(200);
			response.end();
		},

		function (addr) {
			var options = {
				apiSecure: false,
				apiHostname: addr.address,
				apiPort: addr.port,
				ipPool: ipPool
			};

			var provider = new MandrillProvider(apiKey, options);

			provider.mail(message, function (error) {
				t.equal(typeof error, 'undefined');

				server.close();
			});
		});
});

test('handles api errors correctly', function (t) {
	var message = {
		from: 'no-reply@example.com',
		to: ['user@example.net', 'user@example.org'],
		cc: ['user2@example.net'],
		bcc: ['user3@example.net'],
		replyto: 'info@example.com',
		subject: 'testing, 123...',
		textBody: 'please disregard',
		htmlBody: '<p>please disregard</p>'
	};

	t.plan(5);

	var server = setupTestServer(t,
		function (request, response, body) {
			var error = JSON.stringify({status:'error', message:'generic fail'});

			response.writeHead(503, { 'Content-Length': error.length });
			response.write(error);
			response.end();
		},

		function (addr) {
			var options = {
				apiSecure: false,
				apiHostname: addr.address,
				apiPort: addr.port
			};

			var provider = new MandrillProvider('blah', options);

			provider.mail(message, function (error) {
				t.notEqual(typeof error, 'undefined');
				t.equal(error.httpStatusCode, 503);

				server.close();
			});
		});
});

test('check lack of callback', function (t) {
	var message = {
		from: 'no-reply@example.com',
		to: ['user@example.net', 'user@example.org'],
		cc: ['user2@example.net'],
		bcc: ['user3@example.net'],
		replyto: 'info@example.com',
		subject: 'testing, 123...',
		textBody: 'please disregard',
		htmlBody: '<p>please disregard</p>'
	};

	t.plan(3);

	var server = setupTestServer(t,
		function (request, response, body) {
			var error = JSON.stringify({status:'error', message:'generic fail'});

			response.writeHead(503, { 'Content-Length': error.length });
			response.write(error);
			response.end();

			server.close();
		},

		function (addr) {
			var options = {
				apiSecure: false,
				apiHostname: addr.address,
				apiPort: addr.port
			};

			var provider = new MandrillProvider('blah', options);

			provider.mail(message);
		});
});

// will generate 3 assertions
function setupTestServer(t, handler, callback) {
	var server = http.createServer(function (request, response) {
		t.equal(request.method, 'POST');
		t.equal(request.url, '/api/1.0/messages/send.json');
		t.equal(request.headers['content-type'], 'application/json');

		body = '';

		request.on('data', function (chunk) {
			body += chunk;
		});

		request.on('end', function () {
			handler(request, response, body);
		});
	});

	server.listen(function () {
		var addr = server.address();

		callback(addr);
	});

	return server;
}
