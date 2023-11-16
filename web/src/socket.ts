export const openSocket = (): WebSocket => {
	const socket = new WebSocket('/');

	socket.binaryType = 'arraybuffer';

	socket.onmessage = event => {
		const data = event.data;
		if (!(data instanceof ArrayBuffer)) return;

		const view = new DataView(data);

		const messageId = view.getUint8(0);

		if (messageId === 1) {
			/* team created */
		} else if (messageId === 2) {
			/* team removed */
		} else if (messageId === 3) {
			/* name changed */
		} else if (messageId === 4) {
			/* user color changed */
		} else if (messageId === 5) {
			/* team joined  */
		}
	};

	return socket;
};
