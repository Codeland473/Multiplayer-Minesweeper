import { Draft } from 'immer';
import { GlobalState, update, useGlobalState } from '../global-state.js';
import { Data } from './data.js';
import { Sender } from './sender.js';

export namespace Socket {
	const globalSocket: [WebSocket | undefined] = [undefined];
	let timerId: number;

	const INITIAL_ERROR_TIME = 10;

	export type Receiver = (reader: Data.Reader) => void;

	const receivers: { [receiveCode: number]: Receiver } = {};

	const clearState = (state: Draft<GlobalState>) => {
		state.game = undefined;
		state.gameSettings = undefined;
		state.teams = [];
		state.players = state.players.filter(
			player => player.id === state.selfPlayerId,
		);
		state.log = [];
	};

	const onError = () => {
		console.error('could not connect to websocket!');

		globalSocket[0] = undefined;

		update(state => {
			state.connectionState.status = 'error';
			clearState(state);

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

	function onOpen(this: WebSocket) {
		const { players, selfPlayerId } = useGlobalState.getState();
		const selfPlayer = players.find(player => player.id === selfPlayerId);

		update(state => {
			state.connectionState.error = undefined;
			if (selfPlayer === undefined)
				state.connectionState.status = 'connected';
		});

		console.log('connected to websocket!');
		if (selfPlayer !== undefined) console.log('Rejoining...');

		globalSocket[0] = this;
		if (selfPlayer !== undefined) {
			Sender.join(
				selfPlayer.id,
				selfPlayer.teamId,
				selfPlayer.color,
				true,
				selfPlayer.name,
			);
		}
	}

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

		console.log(useGlobalState.getState());
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
			const socket = globalSocket[0];
			if (socket === undefined) throw Error('Socket is down!');
			const buffer = preSender(...params);
			console.log(`Sending code ${buffer[0]}`);
			socket.send(buffer);
		};
	};

	export const registerReceiver = (
		receiveCode: number,
		receiver: Receiver,
	) => {
		receivers[receiveCode] = receiver;
	};
}
