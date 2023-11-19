import { produce, Draft } from 'immer';
import { GlobalState, update, useGlobalState } from './globalState.js';
import { onMessage } from './protocol.js';

export namespace Socket {
	let globalSocket: WebSocket;
	let timerId: number;

	export const get = () => globalSocket;

	const INITIAL_ERROR_TIME = 10;
	const initialErrorState = {
		lastTime: INITIAL_ERROR_TIME,
		timeout: INITIAL_ERROR_TIME,
		loading: false,
	};

	const onError = () => {
		update(state => {
			if (state.connectionState === undefined) {
				state.connectionState = initialErrorState;
			} else {
				const newTime = state.connectionState.lastTime * 2;

				state.connectionState.lastTime = newTime;
				state.connectionState.timeout = newTime;
				state.connectionState.loading = false;
			}
		});

		timerId = window.setInterval(() => {
			const errorState = useGlobalState.getState().connectionState;
			if (errorState === undefined || errorState.timeout === 0) return;

			if (errorState.timeout === 1) {
				newSocket();
			} else {
				update(state => {
					if (state.connectionState === undefined) {
						state.connectionState = initialErrorState;
					} else {
						--state.connectionState.timeout;
					}
				});
			}
		}, 1000);
	};

	const onOpen = () => {
		produce(state => {
			state.errorState = undefined;
		});
		window.clearInterval(timerId);
	};

	const newSocket = () => {
		update(state => {
			if (state.connectionState === undefined) {
				state.connectionState = {
					lastTime: INITIAL_ERROR_TIME,
					timeout: 0,
					loading: true,
				};
			} else {
				state.connectionState.timeout = 0;
				state.connectionState.loading = true;
			}
		});

		globalSocket = new WebSocket('/');
		globalSocket.binaryType = 'arraybuffer';
		globalSocket.onmessage = onMessage;
		globalSocket.onerror = onError;
		globalSocket.onopen = onOpen;
	};

	export const startup = () => {
		newSocket();
	};
}
