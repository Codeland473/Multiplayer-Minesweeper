import { produce, original, type Draft, nothing, Immutable } from 'immer';
import {
	Color,
	GameSettings,
	GlobalState,
	Player,
	useGameState as useGlobalState,
} from './globalState.js';
import { Log } from './log.js';
import { Socket } from 'dgram';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

type Reader = {
	getByte(): number;
	getBool(): boolean;
	getInt(): number;
	getFloat(): number;
	getString(): string;
	getByteArray(length: number): Uint8Array;
	getIntArray(length: number): DataView;
};

const createReader = (data: ArrayBuffer): Reader => {
	const view = new DataView(data);
	let offset = 0;

	return {
		getByte: () => {
			const value = view.getUint8(offset);
			offset += 1;
			return value;
		},
		getBool: () => {
			const value = view.getUint8(offset);
			offset += 1;
			return value !== 0;
		},
		getInt: () => {
			const value = view.getInt32(offset);
			offset += 4;
			return value;
		},
		getFloat: () => {
			const value = view.getFloat32(offset);
			offset += 4;
			return value;
		},
		getString: () => {
			const stringLength = view.getUint16(offset);
			const value = textDecoder.decode(
				new DataView(data, offset, stringLength),
			);
			offset += 2 + stringLength;
			return value;
		},
		getByteArray: (length: number): Uint8Array => {
			const value = new Uint8Array(data, offset, length);
			offset += length;
			return value;
		},
		getIntArray: (length: number): DataView => {
			const value = new DataView(data, offset, length * 4);
			offset += length * 4;
			return value;
		},
	};
};

type Writer = {
	writeByte(byte: number): void;
	writeBool(bool: boolean): void;
	writeInt(int: number): void;
	writeFloat(float: number): void;
	writeString(encoded: Uint8Array): void;
};

const createWriter = (data: Uint8Array): Writer => {
	const view = new DataView(data.buffer);
	let offset = 0;

	return {
		writeByte: (byte: number) => {
			view.setInt8(offset, byte);
			offset += 1;
		},
		writeBool: (bool: boolean) => {
			view.setInt8(offset, bool ? 1 : 0);
			offset += 1;
		},
		writeFloat: (float: number) => {
			view.setFloat32(offset, float);
			offset += 4;
		},
		writeInt: (int: number) => {
			view.setInt32(offset, int);
			offset += 4;
		},
		writeString: (encoded: Uint8Array) => {
			view.setUint16(offset, encoded.length);
			data.set(encoded, offset + 2);
			offset += 2 + encoded.length;
		},
	};
};

const findTeamIndex = (state: Draft<GlobalState>, teamId: number) => {
	const { teams } = original(state)!;
	const index = teams.findIndex(({ id }) => id === teamId);
	return [index, teams[index] as Immutable<(typeof teams)[number]>] as const;
};

const findPlayerIndex = (state: Draft<GlobalState>, playerId: number) => {
	const { players } = original(state)!;
	const index = players.findIndex(({ id }) => id === playerId);
	return [
		index,
		players[index] as Immutable<(typeof players)[number]>,
	] as const;
};

const update = (
	updater: (state: Draft<GlobalState>) => void | GlobalState | typeof nothing,
) => {
	useGlobalState.setState(produce(updater));
};

enum SettingCode {
	IS_NO_GUESSING = 1,
	IS_SUDDEN_DEATH = 2,
	BOARD_SIZE = 3,
	MINE_COUNT = 4,
}

enum ReceiveCode {
	TEAM_CREATE = 1,
	TEAM_REMOVE = 2,
	TEAM_NAME_UPDATE = 11,

	SELF_JOIN = 50,

	PLAYER_CREATE = 51,
	PLAYER_REMOVE = 52,
	PLAYER_NAME_UPDATE = 3,
	PLAYER_COLOR_UPDATE = 4,
	PLAYER_TEAM_UPDATE = 5,

	SETTINGS_UPDATE = 6,
}

enum SendCode {
	TEAM_CREATE = 1,
	TEAM_REMOVE = 2,
	SELF_NAME_UPDATE = 3,
	SELF_COLOR_UPDATE = 4,
	SELF_TEAM_UPDATE = 5,
	SETTINGS_UPDATE = 6,
	TEAM_NAME_UPDATE = 11,
	SELF_JOIN = 50,
}

export const openSocket = (): WebSocket => {
	const socket = new WebSocket('/');

	socket.binaryType = 'arraybuffer';

	socket.onmessage = event => {
		const data = event.data;
		if (!(data instanceof ArrayBuffer)) return;

		const reader = createReader(data);

		const messageId = reader.getByte();

		if (messageId === ReceiveCode.TEAM_CREATE) {
			const teamId = reader.getInt();
			const byPlayerId = reader.getInt();
			const teamName = reader.getString();

			update(state => {
				const [index, team] = findTeamIndex(state, teamId);

				if (index === -1) {
					state.teams.push({ id: teamId, name: teamName });
				} else {
					state.teams[index].name = teamName;

					state.log.push({
						type: Log.Type.TEAM_NAME_UPDATE,
						teamId,
						byPlayerId,
						oldName: team.name,
						newName: teamName,
					} satisfies Log.TeamNameUpdate);
				}
			});
		} else if (messageId === ReceiveCode.TEAM_REMOVE) {
			const teamId = reader.getInt();
			const byPlayerId = reader.getInt();

			update(state => {
				const [index, removedTeam] = findTeamIndex(state, teamId);
				if (index === -1) return;

				state.teams.splice(index, 1);

				state.log.push({
					type: Log.Type.TEAM_REMOVE,
					teamId: removedTeam.id,
					teamName: removedTeam.name,
					byPlayerId,
				} satisfies Log.TeamRemove);
			});
		} else if (messageId === ReceiveCode.TEAM_NAME_UPDATE) {
			const teamId = reader.getInt();
			const byPlayerId = reader.getInt();
			const teamName = reader.getString();

			update(state => {
				const [teamIndex, team] = findTeamIndex(state, teamId);
				if (teamIndex === -1) return;

				state.teams[teamIndex].name = teamName;

				state.log.push({
					type: Log.Type.TEAM_NAME_UPDATE,
					teamId,
					byPlayerId,
					oldName: team.name,
					newName: teamName,
				} satisfies Log.TeamNameUpdate);
			});
		} else if (messageId === ReceiveCode.PLAYER_CREATE) {
			const playerId = reader.getInt();
			const red = reader.getByte();
			const green = reader.getByte();
			const blue = reader.getByte();
			const name = reader.getString();

			update(state => {
				const [existingIndex] = findPlayerIndex(state, playerId);

				if (existingIndex === -1) {
					state.players.push({
						id: playerId,
						color: [red, green, blue],
						name,
						teamId: undefined,
					});
				} else {
					const player = state.players[existingIndex];
					player.name = name;
					player.color = [red, green, blue];
				}
			});
		} else if (messageId === ReceiveCode.PLAYER_REMOVE) {
			const playerId = reader.getInt();

			update(state => {
				const [removeIndex] = findPlayerIndex(state, playerId);
				if (removeIndex === -1) return;

				state.players.splice(removeIndex, 1);
			});
		} else if (messageId === ReceiveCode.PLAYER_NAME_UPDATE) {
			const playerId = reader.getInt();
			const name = reader.getString();

			update(state => {
				const [index] = findPlayerIndex(state, playerId);
				if (index === -1) return;

				state.players[index].name = name;
			});
		} else if (messageId === ReceiveCode.PLAYER_COLOR_UPDATE) {
			const playerId = reader.getInt();
			const red = reader.getByte();
			const green = reader.getByte();
			const blue = reader.getByte();

			update(state => {
				const [index] = findPlayerIndex(state, playerId);
				if (index === -1) return;

				state.players[index].color = [red, green, blue];
			});
		} else if (messageId === ReceiveCode.PLAYER_TEAM_UPDATE) {
			const playerId = reader.getInt();
			const teamId = reader.getInt();

			update(state => {
				const [, team] = findTeamIndex(state, teamId);
				if (team === undefined) return;

				const [playerIndex] = findPlayerIndex(state, playerId);
				if (playerIndex === -1) return;

				state.players[playerIndex].teamId = team.id;
			});
		} else if (messageId === ReceiveCode.SELF_JOIN) {
			/* settings */
			const __unused = reader.getInt();
			const isNoGuessing = reader.getBool();
			const isSuddenDeath = reader.getBool();
			const boardWidth = reader.getInt();
			const boardHeight = reader.getInt();
			const mineCount = reader.getInt();

			const numPlayers = reader.getInt();
			const numTeams = reader.getInt();

			const selfPlayerId = reader.getInt();

			const teamIds = Array.from(new Array(numTeams), () =>
				reader.getInt(),
			);
			const playerIds = Array.from(new Array(numPlayers), () =>
				reader.getInt(),
			);
			const playerColors = Array.from(
				new Array(numPlayers),
				() =>
					<const>[
						reader.getByte(),
						reader.getByte(),
						reader.getByte(),
					],
			);
			const playerTeamIds = Array.from(new Array(numPlayers), () =>
				reader.getInt(),
			);
			const teamNames = Array.from(new Array(numTeams), () =>
				reader.getString(),
			);
			const playerNames = Array.from(new Array(numPlayers), () =>
				reader.getString(),
			);
			const gameGoing = reader.getBool();

			const boardState = gameGoing
				? {
						gameTimer: reader.getFloat(),
						board: reader.getByteArray(boardWidth * boardHeight),
						revealedMask: reader.getByteArray(
							boardWidth * boardHeight,
						),
						flagStates: reader.getIntArray(
							boardWidth * boardHeight,
						),
				  }
				: undefined;

			update(state => {
				const settings = {
					boardWidth,
					boardHeight,
					isSuddenDeath,
					isNoGuessing,
					mineCount,
				};
				state.gameSettings = settings;

				state.selfPlayerId = selfPlayerId;

				state.players = Array.from(
					new Array(numPlayers),
					(_, index) => ({
						id: playerIds[index],
						color: playerColors[index] as Draft<Color>,
						name: playerNames[index],
						teamId:
							playerTeamIds[index] === 0
								? undefined
								: playerTeamIds[index],
					}),
				);

				state.teams = Array.from(new Array(numTeams), (_, index) => ({
					id: teamIds[index],
					name: teamNames[index],
				}));

				if (boardState !== undefined) {
					state.game = {
						board: {
							board: Array.from(boardState.board),
							width: boardWidth,
							height: boardHeight,
							flags: Array.from(
								new Array(boardWidth * boardHeight),
								(_, index) =>
									boardState.flagStates.getInt32(index * 4),
							),
							revealed: Array.from(boardState.revealedMask).map(
								num => num !== 0,
							),
						},
						settings,
						gameTimer: boardState.gameTimer,
						cursors: [],
						playersGameState: {},
					};
				}
			});
		} else if (messageId === ReceiveCode.SETTINGS_UPDATE) {
			const settingId = reader.getInt();
			const _fromPlayerId = reader.getInt();

			const setSetting: Draft<Partial<GameSettings>> = {};

			if (settingId === SettingCode.IS_NO_GUESSING) {
				setSetting.isNoGuessing = reader.getBool();
			} else if (settingId === SettingCode.IS_SUDDEN_DEATH) {
				setSetting.isSuddenDeath = reader.getBool();
			} else if (settingId === SettingCode.BOARD_SIZE) {
				setSetting.boardWidth = reader.getInt();
				setSetting.boardHeight = reader.getInt();
			} else if (settingId === SettingCode.MINE_COUNT) {
				setSetting.mineCount = reader.getInt();
			}

			update(state => {
				if (state.gameSettings === undefined) return;
				Object.assign(state.gameSettings, setSetting);
			});
		}
	};

	return socket;
};

export const sendTeamCreate = (socket: WebSocket, teamName: string) => {
	const nameBuffer = textEncoder.encode(teamName);

	const sendBuffer = new Uint8Array(1 + 2 + nameBuffer.length);
	const writer = createWriter(sendBuffer);

	writer.writeByte(SendCode.TEAM_CREATE);
	writer.writeString(nameBuffer);

	socket.send(sendBuffer);
};

export const sendTeamRemove = (Socket: WebSocket, teamId: number) => {
	const sendBuffer = new Uint8Array(1 + 4);
	const writer = createWriter(sendBuffer);

	writer.writeByte(SendCode.TEAM_REMOVE);
	writer.writeInt(teamId);

	Socket.send(sendBuffer);
};

export const sendSelfNameUpdate = (socket: WebSocket, name: string) => {
	const nameBuffer = textEncoder.encode(name);

	const sendBuffer = new Uint8Array(1 + 2 + nameBuffer.length);
	const writer = createWriter(sendBuffer);

	writer.writeByte(SendCode.SELF_NAME_UPDATE);
	writer.writeString(nameBuffer);

	socket.send(sendBuffer);
};

export const sendSelfColorUpdate = (socket: WebSocket, color: Color) => {
	const sendBuffer = new Uint8Array(1 + 3);
	const writer = createWriter(sendBuffer);

	writer.writeByte(SendCode.SELF_COLOR_UPDATE);
	writer.writeByte(color[0]);
	writer.writeByte(color[1]);
	writer.writeByte(color[2]);

	socket.send(sendBuffer);
};

export const sendMoveTeams = (
	socket: WebSocket,
	teamId: number | undefined,
) => {
	const sendBuffer = new Uint8Array(1 + 4);
	const writer = createWriter(sendBuffer);

	writer.writeByte(SendCode.SELF_COLOR_UPDATE);
	writer.writeInt(teamId ?? 0);

	socket.send(sendBuffer);
};

export const sendSettingUpdate = (
	socket: WebSocket,
	setSetting: Partial<GameSettings>,
) => {
	if (
		setSetting.boardHeight !== undefined &&
		setSetting.boardWidth !== undefined
	) {
		const sendBuffer = new Uint8Array(1 + 4 + 8);
		const writer = createWriter(sendBuffer);

		writer.writeByte(SendCode.SETTINGS_UPDATE);
		writer.writeInt(SettingCode.BOARD_SIZE);
		writer.writeInt(setSetting.boardWidth);
		writer.writeInt(setSetting.boardHeight);

		socket.send(sendBuffer);
	} else if (setSetting.isNoGuessing !== undefined) {
		const sendBuffer = new Uint8Array(1 + 4 + 1);
		const writer = createWriter(sendBuffer);

		writer.writeByte(SendCode.SETTINGS_UPDATE);
		writer.writeInt(SettingCode.IS_NO_GUESSING);
		writer.writeBool(setSetting.isNoGuessing);

		socket.send(sendBuffer);
	} else if (setSetting.isSuddenDeath !== undefined) {
		const sendBuffer = new Uint8Array(1 + 4 + 1);
		const writer = createWriter(sendBuffer);

		writer.writeByte(SendCode.SETTINGS_UPDATE);
		writer.writeInt(SettingCode.IS_SUDDEN_DEATH);
		writer.writeBool(setSetting.isSuddenDeath);

		socket.send(sendBuffer);
	} else if (setSetting.mineCount !== undefined) {
		const sendBuffer = new Uint8Array(1 + 4 + 4);
		const writer = createWriter(sendBuffer);

		writer.writeByte(SendCode.SETTINGS_UPDATE);
		writer.writeInt(SettingCode.MINE_COUNT);
		writer.writeInt(setSetting.mineCount);

		socket.send(sendBuffer);
	}
};

export const sendTeamNameUpdate = (
	socket: WebSocket,
	teamId: number,
	name: string,
) => {
	const nameBuffer = textEncoder.encode(name);

	const sendBuffer = new Uint8Array(1 + 4 + 2 + nameBuffer.length);
	const writer = createWriter(sendBuffer);

	writer.writeByte(SendCode.TEAM_NAME_UPDATE);
	writer.writeInt(teamId);
	writer.writeString(nameBuffer);

	socket.send(sendBuffer);
};

export const sendJoin = (
	socket: WebSocket,
	rejoinId: number | undefined,
	rejoinTeamId: number | undefined,
	color: Color,
	name: string,
) => {
	const nameBuffer = textEncoder.encode(name);

	const sendBuffer = new Uint8Array(1 + 4 + 4 + 3 + 2 + nameBuffer.length);
	const writer = createWriter(sendBuffer);

	writer.writeByte(SendCode.SELF_JOIN);
	writer.writeInt(rejoinId ?? 0);
	writer.writeInt(rejoinTeamId ?? 0);
	writer.writeByte(color[0]);
	writer.writeByte(color[1]);
	writer.writeByte(color[2]);
	writer.writeString(nameBuffer);

	socket.send(sendBuffer);
};
