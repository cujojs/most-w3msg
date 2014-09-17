/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
/** @module */

var most = require('most');

var create = most.create;
var fromPromise = most.fromPromise;

exports.fromWebSocket = fromWebSocket;
exports.toWebSocket = toWebSocket;

/**
 * Create a stream from a WebSocket.  The stream will end when the WebSocket
 * closes, and will fail if the WebSocket fails.
 * @param {WebSocket} ws WebSocket (or compatible, eg SockJS) from
 *  which to create a stream
 * @param {function():*} dispose
 * @returns {Stream} stream of all the messages received by the WebSocket
 */
function fromWebSocket(ws, dispose) {
	return create(function(add, end, error) {
		return pipeFromWebSocket(ws, dispose, add, end, error);
	});
}

function pipeFromWebSocket(ws, dispose, add, end, error) {
	ws.addEventListener('open', onOpen);

	function onOpen() {
		ws.addEventListener('close', end);
		ws.addEventListener('error', error);
		ws.addEventListener('message', add);
	}

	return function() {
		ws.removeEventListener('close', end);
		ws.removeEventListener('error', error);
		ws.removeEventListener('message', add);
		return dispose();
	};
}

/**
 * Send all events in a stream to a WebSocket
 * @param {Stream} stream Stream whose events will be sent to the WebSocket
 * @param {WebSocket} ws WebSocket (or compatible, eg SockJS) to which to
 *  send events
 * @returns {Promise} promise for the end of the stream.  If the WebSocket closes
 *  before the stream ends, the returned promise will fulfill if the WebSocket
 *  closes cleanly, or will reject if the WebSocket errors.  If the stream ends
 *  before the WebSocket closes, the returned promise will fulfill if the stream
 *  ends cleanly, or will reject if the stream errors.
 */
function toWebSocket(stream, ws) {
	return new Promise(function(resolve) {
		pipeToWebSocket(stream, ws, resolve);
	});
}

function pipeToWebSocket(stream, ws, resolve) {
	ws.addEventListener('open', function onOpen() {
		initToWebSocket(stream, ws, resolve);
	});
}

function initToWebSocket(stream, ws, resolve) {
	var endSignal = fromPromise(new Promise(function(resolve, reject) {
		ws.addEventListener('close', resolve);
		ws.addEventListener('error', reject);
	}));

	var result = stream.takeUntil(endSignal).forEach(function (x) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(x);
		}
	});

	resolve(result);
}