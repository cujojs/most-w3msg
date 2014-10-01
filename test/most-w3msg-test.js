require('buster').spec.expose();
//var expect = require('buster').expect;

var mws = require('../most-w3msg');
var fromWebSocket = mws.fromWebSocket;
var toWebSocket = mws.toWebSocket;

describe('fromWebSocket', function() {
	it('should contain messages received by WebSocket');
});

describe('toWebSocket', function() {
	it('should send messages to WebSocket');
});