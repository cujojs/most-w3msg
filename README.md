# most.js W3C Messaging adapters

Create a most.js stream from a [WebSocket](https://developer.mozilla.org/en-US/docs/WebSockets) (or SockJS, etc.), [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), [MessagePort](http://msdn.microsoft.com/en-us/library/windows/apps/hh465957.aspx) (or anything with the `postMessage()` API), or [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) and get all the filtering, transforming, reducing, etc goodness:

```js
var fromWebSocket = require('most-w3msg').fromWebSocket;

var socket1 = new WebSocket('ws://localhost:8001');
var socket2 = new WebSocket('ws://localhost:8002');

// Merge 2 websockets into a single stream
// When the merged stream ends, both socket1.close and socket2.close
// will be called.
var stream = fromWebSocket(socket1, socket1.close.bind(socket1))
	.merge(fromWebSocket(socket2, socket2.close.bind(socket2));

// Log the first 10 items that meet the awesomeness criteria
// regardless of which socket they come from
stream.map(JSON.parse)
	.filter(function(item) {
		return item.awesomeness > 42;
	})
	.take(10)
	.forEach(function(awesomeItem) {
		console.log(awesomeItem);
	});
```

## API

### fromWebSocket

####`fromWebSocket(webSocket [, dispose]) -> Stream`

Create a stream from a WebSocket.  The stream will contain all messages received by the WebSocket *from the time a consumer begins observing the stream* (using `observe`, `.forEach` or `.reduce`).  The stream will end when the WebSocket closes, or will error if the WebSocket errors.

`fromWebSocket` does not close the WebSocket automatically.  You can pass-in a `dispose` function if you want to close the socket when the stream ends or once all consumers of the stream have lost interest:

```js
var stream = fromWebSocket(socket, socket.close.bind(socket));
```

### toWebSocket

####`toWebSocket(stream, webSocket) -> Promise`

Send all events from a stream to a WebSocket, and return a promise for the end of the stream.

If the WebSocket closes before the stream ends, the returned promise will fulfill if the WebSocket closes cleanly, or will reject if the WebSocket errors.  If the stream ends before the WebSocket closes, the returned promise will fulfill if the stream ends cleanly, or will reject if the stream errors.

`toWebSocket` does not close the WebSocket automatically.  The creator of the WebSocket should close it.

### fromEventSource

####`fromEventSource(eventSource [, dispose]) -> Stream`

### fromEventSourceOn

####`fromEventSourceOn(eventName, eventSource [, dispose]) -> Stream`

### fromMessagePort

####`fromMessagePort(port [, dispose]) -> Stream`

### toMessagePort

####`toMessagePort(stream, port) -> Promise`

### fromWorker

####`fromWorker(worker [, dispose]) -> Stream`

### toWorker

####`toWorker(worker, port) -> Promise`
