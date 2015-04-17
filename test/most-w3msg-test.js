require('buster').spec.expose();
var expect = require('buster').expect;
var fakes = require('./helper/fakes');

var mws = require('../most-w3msg');

var sentinel = { value: 'sentinel' };

describe('fromWebSocket', function() {
	it('should contain messages received by WebSocket', function() {
		var ws = new fakes.FakeWebSocket();

		var s = mws.fromWebSocket(ws, ws.close.bind(ws));
		var spy = this.spy();

		setTimeout(function() {
			ws.send(sentinel);
		}, 0);

		return s.take(1).observe(spy).then(function() {
			expect(spy).toHaveBeenCalledOnceWith(sentinel);
		});
	});

	it('should call disposer when stream ends', function() {
		var ws = new fakes.FakeWebSocket();

		var spy = this.spy();
		var s = mws.fromWebSocket(ws, spy);

		setTimeout(function() {
			ws.send(sentinel);
		}, 0);

		return s.take(1).drain().then(function() {
			expect(spy).toHaveBeenCalledOnce();
		});
	});
});

describe('fromEventSource', function() {
	it('should contain messages received by EventSource', function() {
		var es = new fakes.FakeEventSource();

		var s = mws.fromEventSource(es, es.close.bind(es));
		var spy = this.spy();

		setTimeout(function() {
			es.emit('message', sentinel);
		}, 0);

		return s.take(1).observe(spy).then(function() {
			expect(spy).toHaveBeenCalledOnceWith(sentinel);
		});
	});

	it('should call disposer when stream ends', function() {
		var es = new fakes.FakeEventSource();

		var spy = this.spy();
		var s = mws.fromEventSource(es, spy);

		setTimeout(function() {
			es.emit('message', sentinel);
		}, 0);

		return s.take(1).drain().then(function() {
			expect(spy).toHaveBeenCalledOnce();
		});
	});
});

describe('fromEventSourceOn', function() {
	it('should contain events received by EventSource', function() {
		var es = new fakes.FakeEventSource();

		var s = mws.fromEventSourceOn('test', es, es.close.bind(es));
		var spy = this.spy();

		setTimeout(function() {
			es.emit('test', sentinel);
		}, 0);

		return s.take(1).observe(spy).then(function() {
			expect(spy).toHaveBeenCalledOnceWith(sentinel);
		});
	});
});