exports.FakeEventTarget = FakeEventTarget;
exports.FakeEventSource = FakeEventSource;
exports.FakeWebSocket = FakeWebSocket;
exports.FakeMessagePort = FakeMessagePort;

function FakeEventTarget() {
    this._events = {};
}

FakeEventTarget.prototype.emit = function(e, x) {
    var handler = this._events[e];
    if(typeof handler !== 'function') {
        return;
    }
    handler(x);
};

FakeEventTarget.prototype.addEventListener = function(e, handler) {
    this._events[e] = handler;
};

FakeEventTarget.prototype.removeEventListener = function(e, handler) {
    if(handler !== this._events[e]) {
        throw new Error('removed wrong handler');
    }
    this._events[e] = void 0;
};

function FakeEventSource() {
    FakeEventTarget.call(this);
    this.isOpen = true;
}

FakeEventSource.prototype = Object.create(FakeEventTarget.prototype);

FakeEventSource.prototype.close = function() {
    if(!this.isOpen) {
        throw new Error('closed more than once');
    }
    this.isOpen = false;
    this.emit('close', void 0);
};

function FakeWebSocket() {
    FakeEventSource.call(this);
}

FakeWebSocket.prototype = Object.create(FakeEventSource.prototype);

FakeWebSocket.prototype.send = function(x) {
    this.emit('message', x);
};

function FakeMessagePort() {
    FakeEventTarget.call(this);
}

FakeMessagePort.prototype = Object.create(FakeEventTarget.prototype);

FakeMessagePort.prototype.postMessage = function(x) {
    this.emit('message', x);
};
