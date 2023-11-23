import { original, type Draft, Immutable, castDraft } from 'immer';
import {
	Color,
	Cursor,
	GameSettings,
	GlobalState,
	Player,
	PlayerGameStats,
	TeamGameStats,
	update,
} from '../globalState.js';
import { Log } from '../log.js';
import { Data } from './data.js';
import { Socket } from './socket.js';

export namespace Protocol {
	const readSettings = (reader: Data.Reader): GameSettings => {
		const __unused = reader.getInt();

		return {
			isNoGuessing: reader.getBool(),
			isSuddenDeath: reader.getBool(),
			boardWidth: reader.getInt(),
			boardHeight: reader.getInt(),
			mineCount: reader.getInt(),
		};
	};

	const readPlayer = (reader: Data.Reader): Player & { alive: boolean } => {
		const id = reader.getInt();
		const inputTeamId = reader.getInt();

		return {
			id,
			teamId: inputTeamId === 0 ? undefined : inputTeamId,
			color: [reader.getByte(), reader.getByte(), reader.getByte()],
			alive: !reader.getBool(),
			name: reader.getString(),
		};
	};

	const findTeamIndex = (state: Draft<GlobalState>, teamId: number) => {
		const { teams } = original(state)!;
		const index = teams.findIndex(({ id }) => id === teamId);
		return [
			index,
			teams[index] as Immutable<(typeof teams)[number]>,
		] as const;
	};

	const findPlayerIndex = (state: Draft<GlobalState>, playerId: number) => {
		const { players } = original(state)!;
		const index = players.findIndex(({ id }) => id === playerId);
		return [
			index,
			players[index] as Immutable<(typeof players)[number]>,
		] as const;
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

	Socket.registerReceiver(ReceiveCode.TEAM_CREATE, reader => {
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
	});

	Socket.registerReceiver(ReceiveCode.TEAM_REMOVE, reader => {
		const teamId = reader.getInt();
		const byPlayerId = reader.getInt();

		update(state => {
			const [index, removedTeam] = findTeamIndex(state, teamId);
			if (index === -1) return;

			const teamPlayers = state.players.filter(
				player => player.teamId === teamId,
			);

			state.teams.splice(index, 1);

			state.log.push({
				type: Log.Type.TEAM_REMOVE,
				teamId: removedTeam.id,
				teamName: removedTeam.name,
				byPlayerId,
			} satisfies Log.TeamRemove);

			teamPlayers.forEach(teamPlayer => (teamPlayer.teamId = undefined));
		});
	});

	Socket.registerReceiver(ReceiveCode.TEAM_NAME_UPDATE, reader => {
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
	});

	Socket.registerReceiver(ReceiveCode.PLAYER_CREATE, reader => {
		const { alive, color, id, name, teamId } = readPlayer(reader);

		update(state => {
			const [existingIndex] = findPlayerIndex(state, id);
			const checkedTeamId =
				teamId === undefined
					? undefined
					: findTeamIndex(state, teamId)[1].id;

			if (existingIndex === -1) {
				state.players.push({
					id,
					color: castDraft(color),
					name,
					teamId: checkedTeamId,
				});
			} else {
				const player = state.players[existingIndex];
				player.name = name;
				player.color = castDraft(color);
				player.teamId = checkedTeamId;
			}

			if (state.game !== undefined) {
				state.game.playersGameState[id] ??= { alive: true };
				state.game.playersGameState[id].alive = alive;
			}
		});
	});

	Socket.registerReceiver(ReceiveCode.PLAYER_REMOVE, reader => {
		const playerId = reader.getInt();

		update(state => {
			const [removeIndex] = findPlayerIndex(state, playerId);
			if (removeIndex === -1) return;

			state.players.splice(removeIndex, 1);
		});
	});

	Socket.registerReceiver(ReceiveCode.PLAYER_NAME_UPDATE, reader => {
		const playerId = reader.getInt();
		const name = reader.getString();

		update(state => {
			const [index] = findPlayerIndex(state, playerId);
			if (index === -1) return;

			state.players[index].name = name;
		});
	});

	Socket.registerReceiver(ReceiveCode.PLAYER_COLOR_UPDATE, reader => {
		const playerId = reader.getInt();
		const red = reader.getByte();
		const green = reader.getByte();
		const blue = reader.getByte();

		update(state => {
			const [index] = findPlayerIndex(state, playerId);
			if (index === -1) return;

			state.players[index].color = [red, green, blue];
		});
	});

	Socket.registerReceiver(ReceiveCode.PLAYER_TEAM_UPDATE, reader => {
		const playerId = reader.getInt();
		const teamId = reader.getInt();

		update(state => {
			const [playerIndex] = findPlayerIndex(state, playerId);
			if (playerIndex === -1) return;

			if (teamId === 0) {
				state.players[playerIndex].teamId = undefined;
			} else {
				const [, team] = findTeamIndex(state, teamId);
				if (team === undefined) return;

				state.players[playerIndex].teamId = team.id;
			}
		});
	});

	Socket.registerReceiver(ReceiveCode.SELF_JOIN, reader => {
		/* settings */
		const globalSettings = readSettings(reader);

		const numPlayers = reader.getInt();
		const numTeams = reader.getInt();

		const selfPlayerId = reader.getInt();

		/* players */
		const playerIds = Data.readArray(numPlayers, () => reader.getInt());
		const playerColors = Data.readArray(
			numPlayers,
			() =>
				[reader.getByte(), reader.getByte(), reader.getByte()] as const,
		);
		const playerIsDeads = Data.readArray(numPlayers, () =>
			reader.getBool(),
		);
		const playerNames = Data.readArray(numPlayers, () =>
			reader.getString(),
		);
		const playerTeamIds = Data.readArray(numPlayers, () => reader.getInt());
		const cursorLocations = Data.readArray(
			numPlayers,
			() => [reader.getInt(), reader.getInt()] as const,
		);

		/* teams */
		const teamIds = Data.readArray(numTeams, () => reader.getInt());
		const teamIsDeads = Data.readArray(numTeams, () => reader.getBool());
		const teamNames = Data.readArray(numTeams, () => reader.getString());

		const gameGoing = reader.getBool();

		const boardState = gameGoing
			? (() => {
					const { boardWidth, boardHeight, ...rest } =
						readSettings(reader);
					return {
						settings: { boardWidth, boardHeight, ...rest },
						gameTimer: reader.getFloat(),
						board: reader.getByteArray(boardWidth * boardHeight),
						revealedMask: reader.getByteArray(
							boardWidth * boardHeight,
						),
						flagStates: reader.getIntArray(
							boardWidth * boardHeight,
						),
					};
			  })()
			: undefined;

		update(state => {
			state.gameSettings = globalSettings;

			state.selfPlayerId = selfPlayerId;

			state.players = Array.from(new Array(numPlayers), (_, index) => ({
				id: playerIds[index],
				color: playerColors[index] as Draft<Color>,
				name: playerNames[index],
				teamId:
					playerTeamIds[index] === 0
						? undefined
						: playerTeamIds[index],
			}));

			state.teams = Array.from(new Array(numTeams), (_, index) => ({
				id: teamIds[index],
				name: teamNames[index],
			}));

			if (boardState !== undefined) {
				const cursors: Cursor[] = cursorLocations.map(
					([x, y], index) => {
						const playerId = playerIds[index];
						return { playerId, x, y };
					},
				);

				const playersGameState: { [id: number]: PlayerGameStats } = {};
				for (let i = 0; i < numPlayers; ++i) {
					playersGameState[playerIds[i]] = {
						alive: !playerIsDeads[i],
					};
				}

				const teamsGameState: { [id: number]: TeamGameStats } = {};
				for (let i = 0; i < numTeams; ++i) {
					teamsGameState[teamIds[i]] = { alive: !teamIsDeads[i] };
				}

				state.game = {
					board: {
						board: Array.from(boardState.board),
						width: boardState.settings.boardWidth,
						height: boardState.settings.boardHeight,
						flags: Array.from(
							new Array(
								boardState.settings.boardWidth *
									boardState.settings.boardHeight,
							),
							(_, index) =>
								boardState.flagStates.getInt32(index * 4),
						),
						revealed: Array.from(boardState.revealedMask).map(
							num => num !== 0,
						),
					},
					teamsGameState: teamsGameState,
					settings: boardState.settings,
					gameTimer: boardState.gameTimer,
					cursors,
					playersGameState,
				};
			}
		});
	});

	Socket.registerReceiver(ReceiveCode.SETTINGS_UPDATE, reader => {
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
	});

	export const teamCreate = Socket.registerSender((teamName: string) => {
		const nameBuffer = Data.textEncoder.encode(teamName);

		const sendBuffer = new Uint8Array(1 + 2 + nameBuffer.length);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.TEAM_CREATE);
		writer.writeString(nameBuffer);

		return sendBuffer;
	});

	export const teamRemove = Socket.registerSender((teamId: number) => {
		const sendBuffer = new Uint8Array(1 + 4);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.TEAM_REMOVE);
		writer.writeInt(teamId);

		return sendBuffer;
	});

	export const selfNameUpdate = Socket.registerSender((name: string) => {
		const nameBuffer = Data.textEncoder.encode(name);

		const sendBuffer = new Uint8Array(1 + 2 + nameBuffer.length);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.SELF_NAME_UPDATE);
		writer.writeString(nameBuffer);

		return sendBuffer;
	});

	export const selfColorUpdate = Socket.registerSender((color: Color) => {
		const sendBuffer = new Uint8Array(1 + 3);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.SELF_COLOR_UPDATE);
		writer.writeByte(color[0]);
		writer.writeByte(color[1]);
		writer.writeByte(color[2]);

		return sendBuffer;
	});

	export const moveTeams = Socket.registerSender(
		(teamId: number | undefined) => {
			const sendBuffer = new Uint8Array(1 + 4);
			const writer = Data.createWriter(sendBuffer);

			writer.writeByte(SendCode.SELF_TEAM_UPDATE);
			writer.writeInt(teamId ?? 0);

			return sendBuffer;
		},
	);

	export const settingUpdate = Socket.registerSender(
		(setSetting: Partial<GameSettings>) => {
			if (
				setSetting.boardHeight !== undefined &&
				setSetting.boardWidth !== undefined
			) {
				const sendBuffer = new Uint8Array(1 + 4 + 8);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.BOARD_SIZE);
				writer.writeInt(setSetting.boardWidth);
				writer.writeInt(setSetting.boardHeight);

				return sendBuffer;
			} else if (setSetting.isNoGuessing !== undefined) {
				const sendBuffer = new Uint8Array(1 + 4 + 1);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.IS_NO_GUESSING);
				writer.writeBool(setSetting.isNoGuessing);

				return sendBuffer;
			} else if (setSetting.isSuddenDeath !== undefined) {
				const sendBuffer = new Uint8Array(1 + 4 + 1);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.IS_SUDDEN_DEATH);
				writer.writeBool(setSetting.isSuddenDeath);

				return sendBuffer;
			} else if (setSetting.mineCount !== undefined) {
				const sendBuffer = new Uint8Array(1 + 4 + 4);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.MINE_COUNT);
				writer.writeInt(setSetting.mineCount);

				return sendBuffer;
			} else {
				throw Error('Invalid set setting object');
			}
		},
	);

	export const teamNameUpdate = Socket.registerSender(
		(teamId: number, name: string) => {
			const nameBuffer = Data.textEncoder.encode(name);

			const sendBuffer = new Uint8Array(1 + 4 + 2 + nameBuffer.length);
			const writer = Data.createWriter(sendBuffer);

			writer.writeByte(SendCode.TEAM_NAME_UPDATE);
			writer.writeInt(teamId);
			writer.writeString(nameBuffer);

			return sendBuffer;
		},
	);

	export const join = Socket.registerSender(
		(
			rejoinId: number | undefined,
			rejoinTeamId: number | undefined,
			color: Color,
			alive: boolean,
			name: string,
		) => {
			const nameBuffer = Data.textEncoder.encode(name);

			const sendBuffer = new Uint8Array(
				1 + 4 + 4 + 3 + 1 + 2 + nameBuffer.length,
			);
			const writer = Data.createWriter(sendBuffer);

			writer.writeByte(SendCode.SELF_JOIN);
			writer.writeInt(rejoinId ?? 0);
			writer.writeInt(rejoinTeamId ?? 0);
			writer.writeByte(color[0]);
			writer.writeByte(color[1]);
			writer.writeByte(color[2]);
			writer.writeBool(!alive);
			writer.writeString(nameBuffer);

			return sendBuffer;
		},
	);
}
