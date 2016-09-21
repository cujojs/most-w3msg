/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/* globals Promise */

var most = require('most');
var create = require('@most/create');
var fromPromise = most.fromPromise;

var defaultMessageEvent = 'message';

exports.fromWebSocket     = fromMessageSource;
exports.toWebSocket       = toWebSocket;

// EventSource is read-only. See https://developer.mozilla.org/en-US/docs/Web/API/EventSource
exports.fromEventSource   = fromMessageSource;
exports.fromEventSourceOn = fromMessageSourceEvent;

exports.fromMessagePort   = fromMessageSource;
exports.toMessagePort     = toPort;

exports.fromWorker        = fromMessageSource;
exports.toWorker          = toPort;

/**
 * Create a stream from a "source", which can be a WebSocket, EventSource,
 * MessagePort, Worker, or anything that supports addEventListener and "message"
 * events.  The stream will end when the source closes (emits a "close" event),
 * and will fail if the source fails (emits an "error" event)
 * @param {WebSocket} source WebSocket (or compatible, eg SockJS), EventSource,
 *  Worker, etc from which to create a stream
 * @param {function():*} dispose function to execute when the source is closed,
 *  fails, or all consumers lose interest.
 * @returns {Stream} stream containing all the "message" events received by the source
 */
function fromMessageSource(source, dispose) {
	return fromMessageSourceEvent(defaultMessageEvent, source, dispose);
}

/**
 * Create a stream from a "source", which can be a WebSocket, EventSource,
 * MessagePort, Worker, or anything that supports addEventListener
 * events.  The stream will end when the source closes (emits a "close" event),
 * and will fail if the source fails (emits an "error" event)
 * @private
 * @param {string} eventName name of the specific event to listen to
 * @param {WebSocket} source WebSocket (or compatible, eg SockJS), EventSource,
 *  Worker, etc from which to create a stream
 * @param {function():*} dispose function to execute when the source is closed,
 *  fails, or all consumers lose interest.
 * @returns {Stream} stream containing all the "message" events received by the source
 */
function fromMessageSourceEvent(eventName, source, dispose) {
	return create(function(add, end, error) {
		return pipeFromSource(source, eventName, dispose, add, end, error);
	});
}

/**
 * Send all events in a stream to a WebSocket
 * @param {Stream} stream Stream whose events will be sent to the WebSocket
 * @param {WebSocket} socket WebSocket (or compatible, eg SockJS) to which to
 *  send events
 * @returns {Promise} promise for the end of the stream.  If the WebSocket closes
 *  before the stream ends, the returned promise will fulfill if the WebSocket
 *  closes cleanly, or will reject if the WebSocket errors.  If the stream ends
 *  before the WebSocket closes, the returned promise will fulfill if the stream
 *  ends cleanly, or will reject if the stream errors.
 */
function toWebSocket(stream, socket) {
	return pipeToSink(stream, initOpenable, send, socket);
}

function send(socket, msg) {
	socket.send(msg);
}

function initOpenable(openable) {
	return new Promise(function(resolve, reject) {
		openable.addEventListener('open', resolve);
		openable.addEventListener('error', reject);
	});
}

/**
 * Send all events in a stream to anything with a postMessage API
 * @param {Stream} stream Stream whose events will be posted to the sink
 * @param {{postMessage:function(*)}} sink object with postMessage API
 * @returns {Promise} promise for the end of the stream.  If the WebSocket closes
 *  before the stream ends, the returned promise will fulfill if the sink
 *  closes cleanly, or will reject if the WebSocket errors.  If the stream ends
 *  before the WebSocket closes, the returned promise will fulfill if the stream
 *  ends cleanly, or will reject if the stream errors.
 */
function toPort(stream, sink) {
	return pipeToSink(stream, Promise.resolve, postMessage, sink);
}

function postMessage(sink, msg) {
	sink.postMessage(msg);
}

/**
 * Pipe all events from a source to a stream
 * @private
 * @param {{addEventListener:function}} source that supports at least "message" events
 * @param {function} dispose optional function to execute when stream ends
 * @param {function(x:*)} add function to add an event to the stream
 * @param {function()} end function to end the stream
 * @param {function(e:Error)} error function to signal the stream has failed
 * @returns {function} function to remove event handlers and call dispose if provided
 */
function pipeFromSource(source, eventName, dispose, add, end, error) {
	if(typeof dispose !== 'function') {
		dispose = noop;
	}

	if('onopen' in source) {
		source.addEventListener('open', onOpen);
	} else {
		onOpen();
	}

	function onOpen() {
		source.addEventListener('close', end);
		source.addEventListener('error', error);
		source.addEventListener(eventName, add);
	}

	return function() {
		if('onopen' in source) {
			source.removeEventListener('open', add);
		}

		source.removeEventListener('close', end);
		source.removeEventListener('error', error);
		source.removeEventListener(eventName, add);
		return dispose();
	};
}

/**
 * Pipe all events in a stream to a sink
 * @private
 * @param {Stream} stream event stream to pipe to sink
 * @param {function:Promise} init function to initialize the sink before
 *  messages are sent.
 * @param {function} send function to send a message to sink
 * @param {*} sink
 * @returns {Promise} promise that fulfills once the stream ends (ie all events have been sent
 *  to sink), or rejects when stream or sink fails.
 */
function pipeToSink(stream, init, send, sink) {
	return init(sink).then(function() {
		return doSendMessage(stream, send, sink);
	});
}

function doSendMessage(stream, send, sink) {
	var endSignal = fromPromise(new Promise(function(resolve, reject) {
		sink.addEventListener('close', resolve);
		sink.addEventListener('error', reject);
	}));

	return stream.takeUntil(endSignal).forEach(function (x) {
		send(sink, x);
	});
}

function noop() {}

