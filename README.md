# most.js WebSocket adapter

Create a most.js stream from a WebSocket or any compatible API, like SockJS, and get all the filtering, transforming, reducing, etc goodness:

```js
var fromWebSocket = require('most-websocket').fromWebSocket;

var socket1 = new WebSocket('ws://localhost:8001');
var socket2 = new WebSocket('ws://localhost:8002');

// Merge 2 websockets into a single stream
var stream = fromWebSocket(socket).merge(fromWebSocket(socket2));

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

### `fromWebSocket(webSocket:WebSocket) -> Stream`

Create a stream from a WebSocket.  The stream will contain all messages received by the WebSocket *from the time a consumer begins observing the stream* (using `.forEach` or `.reduce`).  The stream will end when the WebSocket closes, or will error if the WebSocket errors.

`fromWebSocket` does not close the WebSocket automatically.  The creator of the WebSocket should close it.

### `toWebSocket(stream:Stream, webSocket:WebSocket) -> Promise`

Send all events from a stream to a WebSocket, and return a promise for the end of the stream.

If the WebSocket closes before the stream ends, the returned promise will fulfill if the WebSocket closes cleanly, or will reject if the WebSocket errors.  If the stream ends before the WebSocket closes, the returned promise will fulfill if the stream ends cleanly, or will reject if the stream errors.

`toWebSocket` does not close the WebSocket automatically.  The creator of the WebSocket should close it.
