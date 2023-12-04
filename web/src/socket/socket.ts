import { update, useGlobalState } from '../global-state.js';
import { Data } from './data.js';

export namespace Socket {
	const globalSocket: [WebSocket] = [undefined as any];
	let timerId: number;

	const INITIAL_ERROR_TIME = 10;

	export type Receiver = (reader: Data.Reader) => void;

	const receivers: { [receiveCode: number]: Receiver } = {};

	const onError = () => {
		console.error('could not connect to websocket!');

		update(state => {
			state.connectionState.status = 'error';

			if (state.connectionState.error === undefined) {
				state.connectionState.error = {
					lastTime: INITIAL_ERROR_TIME,
					timeout: INITIAL_ERROR_TIME,
				};
			} else {
				const newTime = state.connectionState.error.lastTime * 2;
				state.connectionState.error.lastTime = newTime;
				state.connectionState.error.timeout = newTime;
			}
		});

		timerId = window.setInterval(() => {
			const connectionState = useGlobalState.getState().connectionState;
			if (connectionState.status !== 'error') return;
			const errorState = connectionState.error;

			if (errorState !== undefined && errorState.timeout === 1) {
				newSocket();
			} else {
				update(state => {
					state.connectionState.error ??= {
						lastTime: INITIAL_ERROR_TIME,
						timeout: INITIAL_ERROR_TIME,
					};
					--state.connectionState.error.timeout;
				});
			}
		}, 1000);
	};

	const onOpen = () => {
		update(state => {
			state.connectionState.error = undefined;
			state.connectionState.status = 'connected';
		});

		console.log('connected to websocket!');
	};

	export const onMessage = (event: MessageEvent<any>) => {
		const data = event.data;
		if (!(data instanceof ArrayBuffer)) return;

		const reader = Data.createReader(data);

		const messageId = reader.getByte();

		const receiver = receivers[messageId];
		if (receiver === undefined) {
			return console.error(`Unknown receive code ${messageId}`);
		}

		console.log(`received code ${messageId}`);
		receiver(reader);
	};

	export const newSocket = () => {
		window.clearInterval(timerId);
		console.log('connecting to websocket...');

		update(state => {
			state.connectionState.status = 'loading';
			if (state.connectionState.error !== undefined) {
				state.connectionState.error.timeout = 0;
			}
		});

		const socket = new WebSocket('ws://' + location.host);
		socket.binaryType = 'arraybuffer';
		socket.onmessage = onMessage;
		socket.onerror = onError;
		socket.onopen = onOpen;

		globalSocket[0] = socket;
	};

	export const startup = () => {
		newSocket();
	};

	export type PreSender<Params extends any[]> = (
		...params: Params
	) => Uint8Array;

	export type Sender<Params extends any[]> = (...params: Params) => void;

	export const registerSender = <Params extends any[]>(
		preSender: PreSender<Params>,
	): Sender<Params> => {
		return (...params: Params) => {
			const buffer = preSender(...params);
			console.log(`Sending code ${buffer[0]}`);
			globalSocket[0].send(buffer);
		};
	};

	export const registerReceiver = (
		receiveCode: number,
		receiver: Receiver,
	) => {
		receivers[receiveCode] = receiver;
	};
}
