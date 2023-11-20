import { update, useGlobalState } from './globalState.js';
import { onMessage } from './protocol.js';

export namespace Socket {
	let globalSocket: WebSocket;
	let timerId: number;

	export const get = () => globalSocket;

	const INITIAL_ERROR_TIME = 10;

	const onError = (event: ) => {
		update(state => {					
			state.connectionState.status = 'error';

			if (state.connectionState.error === undefined) {
				state.connectionState.error = {
					lastTime: INITIAL_ERROR_TIME,
					timeout: INITIAL_ERROR_TIME,
					message: '32',
				}
			} else {
				const newTime = state.connectionState.error.lastTime * 2
				state.connectionState.error.lastTime = newTime;
				state.connectionState.error.timeout = newTime;
			}
		});

		timerId = window.setInterval(() => {
			const errorState = useGlobalState.getState().connectionState;
			if (errorState.status !== 'error') return;

			if (errorState.timeout === 1) {
				newSocket();
			} else {
				update(state => {
					--state.connectionState.timeout;
				});
			}
		}, 1000);
	};

	const onOpen = () => {
		update(state => {
			state.connectionState.error = undefined;
			state.connectionState.status = 'connected';
		})		
		window.clearInterval(timerId);
	};

	const newSocket = () => {
		update(state => {
			state.connectionState.status = 'loading';
			if (state.connectionState.error !== undefined) {
				state.connectionState.error.timeout = 0;
			}			
		});

		globalSocket = new WebSocket('ws://' + location.host);
		globalSocket.binaryType = 'arraybuffer';
		globalSocket.onmessage = onMessage;
		globalSocket.onerror = onError;
		globalSocket.onopen = onOpen;
	};

	export const startup = () => {
		newSocket();
	};
}
