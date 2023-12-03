import { type Draft, Immutable, castDraft } from 'immer';
import {
	Color,
	Cursor,
	Game,
	GameSettings,
	GlobalState,
	Player,
	PlayerData,
	ShownTeamData,
	TeamData,
	update,
	TeamDatas,
	Team,
	HiddenTeamData,
	TeamProgress,
} from '../global-state.js';
import { Log } from '../log.js';
import { Data } from './data.js';
import { Socket } from './socket.js';
import { ReceiveCode, SettingCode } from './protocol.js';
import {
	isShownTeamData,
	lose,
	reveal,
	setFlag,
	isInboundsBoard,
} from '../tiles.js';
import { imm, mapToObject } from '../util.js';

export namespace Receiver {
	const readSettings = (reader: Data.Reader): GameSettings => {
		const __unused = reader.getInt();

		return {
			isNoGuessing: reader.getBool(),
			isSuddenDeath: reader.getBool(),
			width: reader.getInt(),
			height: reader.getInt(),
			mineCount: reader.getInt(),
			countdownLength: reader.getInt(),
		};
	};

	const readPlayer = (
		reader: Data.Reader,
	): Player & { isAlive: boolean; cursorX: number; cursorY: number } => {
		const id = reader.getInt();
		const color = [
			reader.getByte(),
			reader.getByte(),
			reader.getByte(),
		] as const;
		const name = reader.getString();
		const isDead = reader.getBool();
		const inputTeamId = reader.getInt();
		const cursorX = reader.getInt();
		const cursorY = reader.getInt();

		return {
			id,
			color,
			name,
			isAlive: !isDead,
			teamId: inputTeamId === 0 ? undefined : inputTeamId,
			cursorX,
			cursorY,
		};
	};

	const readTeam = (reader: Data.Reader): Team & HiddenTeamData => {
		const id = reader.getInt();
		const name = reader.getString();
		const isFinished = reader.getBool();
		const isDead = reader.getBool();
		const finishTime = reader.getLong();

		return {
			id,
			name,
			isAlive: !isDead,
			finishTime: isFinished ? undefined : finishTime,
		};
	};

	const readTeamProgress = (
		reader: Data.Reader,
		width: number,
		height: number,
	): Pick<ShownTeamData, 'revealed' | 'flags'> => {
		const revealed = reader.getBooleanArray(width * height);
		const flags = reader.getIntArray(width * height);

		return {
			revealed,
			flags,
		};
	};

	const findTeamIndex = (state: Draft<GlobalState>, teamId: number) => {
		const { teams } = imm(state);
		const index = teams.findIndex(({ id }) => id === teamId);
		return [
			index,
			teams[index] as Immutable<(typeof teams)[number]>,
		] as const;
	};

	const findPlayerIndex = (state: Draft<GlobalState>, playerId: number) => {
		const { players } = imm(state);
		const index = players.findIndex(({ id }) => id === playerId);
		return [
			index,
			players[index] as Immutable<(typeof players)[number]>,
		] as const;
	};

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
		const { isAlive, color, id, name, teamId } = readPlayer(reader);

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
				state.game.playerDatas[id] ??= { isAlive: true };
				state.game.playerDatas[id].isAlive = isAlive;
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

	const readGame = (
		reader: Data.Reader,
		numTeamDatas: number,
	): Pick<Game, 'settings' | 'board' | 'startTime'> & {
		teamProgresses: TeamProgress[];
	} => {
		const settings = readSettings(reader);
		const { width, height } = settings;
		const startTime = reader.getLong();
		const startX = reader.getInt();
		const startY = reader.getInt();
		const board = reader.getByteArray(width * height);
		const teamProgresses = Data.readArray(numTeamDatas, () =>
			readTeamProgress(reader, width, height),
		);

		return {
			board: {
				board,
				width,
				height,
				startX,
				startY,
			},
			startTime,
			settings,
			teamProgresses,
		};
	};

	Socket.registerReceiver(ReceiveCode.SELF_JOIN, reader => {
		/* settings */
		const globalSettings = readSettings(reader);

		const numPlayers = reader.getInt();
		const numTeams = reader.getInt();

		const selfPlayerId = reader.getInt();

		/* players */
		const players = Data.readArray(numPlayers, () => readPlayer(reader));
		const teams = Data.readArray(numPlayers, () => readTeam(reader));

		const gameGoing = reader.getBool();

		const isSpectator = players[selfPlayerId].teamId === undefined;

		const game = gameGoing
			? readGame(reader, isSpectator ? numTeams : 1)
			: undefined;

		update(state => {
			state.gameSettings = globalSettings;

			state.selfPlayerId = selfPlayerId;

			state.players = players.map(player => ({
				id: player.id,
				color: castDraft(player.color),
				name: player.name,
				teamId: player.teamId,
			}));

			state.teams = teams.map(team => ({
				id: team.id,
				name: team.name,
			}));

			if (game === undefined) {
				state.game = undefined;
			} else {
				state.game = {
					board: castDraft(game.board),
					settings: game.settings,
					startTime: game.startTime,
					cursors: players.map(player => ({
						playerId: player.id,
						x: player.cursorX,
						y: player.cursorY,
					})),
					playerDatas: mapToObject(players, ({ isAlive, id }) => ({
						[id]: { isAlive },
					})),
					teamDatas: mapToObject(
						teams,
						({ id, finishTime, isAlive }, index) => {
							const teamProgress = isSpectator
								? game.teamProgresses[index]
								: id === players[selfPlayerId].teamId
								? game.teamProgresses[0]
								: {};

							return {
								[id]: {
									finishTime,
									isAlive,
									...teamProgress,
								},
							};
						},
					),
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
			setSetting.width = reader.getInt();
			setSetting.height = reader.getInt();
		} else if (settingId === SettingCode.MINE_COUNT) {
			setSetting.mineCount = reader.getInt();
		} else if (settingId === SettingCode.COUNTDOWN_LENGTH) {
			setSetting.countdownLength = reader.getInt();
		}

		update(state => {
			if (state.gameSettings === undefined) return;
			Object.assign(state.gameSettings, setSetting);
		});
	});

	const genFlags = (width: number, height: number): number[] =>
		Array.from(new Array(width * height), () => 0);
	const genRevealed = (width: number, height: number): boolean[] =>
		Array.from(new Array(width * height), () => false);

	Socket.registerReceiver(ReceiveCode.GAME_START, reader => {
		const _fromPlayerId = reader.getInt();

		const startTime = reader.getLong();

		const startX = reader.getInt();
		const startY = reader.getInt();

		const settings = readSettings(reader);

		const board = reader.getByteArray(settings.width * settings.height);

		update(draftState => {
			const state = imm(draftState);

			if (state.selfPlayerId === undefined) return;
			const selfTeamId = state.players[state.selfPlayerId].teamId;

			draftState.game = {
				board: {
					board,
					startX: settings.isNoGuessing ? startX : undefined,
					startY: settings.isNoGuessing ? startY : undefined,
					width: settings.width,
					height: settings.height,
				},
				cursors: [],
				playerDatas: Object.assign(
					{},
					...state.players.map(player => ({
						[player.id]: { isAlive: true } satisfies PlayerData,
					})),
				),
				teamDatas: Object.assign(
					{},
					...state.teams.map(({ id }) => ({
						[id]:
							id === selfTeamId || selfTeamId === undefined
								? ({
										isAlive: true,
										flags: genFlags(
											settings.width,
											settings.height,
										),
										revealed: genRevealed(
											settings.width,
											settings.height,
										),
										finishTime: undefined,
								  } satisfies ShownTeamData)
								: ({
										isAlive: true,
										flags: undefined,
										revealed: undefined,
										finishTime: undefined,
								  } satisfies TeamData),
					})),
				),
				settings,
				startTime,
			};
			draftState.gameSettings = settings;
		});
	});

	const getTeamData = (
		teamDatas: Draft<TeamDatas>,
		teamId: number,
	): Draft<ShownTeamData> | undefined => {
		const teamData = teamDatas[teamId];
		if (!isShownTeamData(teamData)) return undefined;
		return teamData;
	};

	Socket.registerReceiver(ReceiveCode.TILE_REVEAL, reader => {
		const playerId = reader.getInt();
		const teamId = reader.getInt();
		const x = reader.getInt();
		const y = reader.getInt();
		const isChord = reader.getBool();

		update(draftState => {
			if (draftState.game === undefined) return;
			const game = imm(draftState.game);

			if (!isInboundsBoard(x, y, game.board)) return;

			const teamData = getTeamData(draftState.game.teamDatas, teamId);
			if (teamData === undefined) return;

			const didLose = reveal(x, y, draftState.game, teamData, isChord);
			if (didLose) lose(draftState.game, draftState.players, playerId);
		});
	});

	Socket.registerReceiver(ReceiveCode.TILE_FLAG, reader => {
		const playerId = reader.getInt();
		const teamId = reader.getInt();
		const x = reader.getInt();
		const y = reader.getInt();
		const isFlagAdded = reader.getBool();
		const isPencil = reader.getBool();

		update(draftState => {
			if (draftState.game === undefined) return;
			const game = imm(draftState.game);

			if (!isInboundsBoard(x, y, game.board)) return;

			const teamData = getTeamData(draftState.game.teamDatas, teamId);
			if (teamData === undefined) return;

			setFlag(
				x,
				y,
				draftState.game,
				teamData,
				playerId,
				isFlagAdded,
				isPencil,
			);
		});
	});

	const readCursor = (reader: Data.Reader): Cursor => {
		return {
			playerId: reader.getInt(),
			x: reader.getFloat(),
			y: reader.getFloat(),
		};
	};

	Socket.registerReceiver(ReceiveCode.CURSOR_UPDATE, reader => {
		const numCursors = reader.getInt();
		const cursors = Data.readArray(numCursors, () => readCursor(reader));

		update(draftState => {
			if (draftState.game === undefined) return;
			draftState.game.cursors = cursors;
		});
	});

	Socket.registerReceiver(ReceiveCode.TEAM_FINISH, reader => {
		const teamId = reader.getInt();
		const time = reader.getLong();

		update(draftState => {
			if (draftState.game === undefined) return;

			const teamData = draftState.game.teamDatas[teamId];
			if (teamData === undefined) return;

			teamData.finishTime = time;
		});
	});

	Socket.registerReceiver(ReceiveCode.PLAYER_LOSE, reader => {
		const playerId = reader.getInt();

		update(draftState => {
			if (draftState.game === undefined) return;

			const playerData = draftState.game.playerDatas[playerId];
			playerData.isAlive = false;
		});
	});

	Socket.registerReceiver(ReceiveCode.TEAM_LOSE, reader => {
		const _clickPlayerId = reader.getInt();
		const teamId = reader.getInt();
		const loseTime = reader.getLong();

		update(draftState => {
			if (draftState.game === undefined) return;

			const teamData = draftState.game.teamDatas[teamId];
			teamData.isAlive = false;
			teamData.finishTime = loseTime;

			for (const player of imm(draftState.players)) {
				if (player.teamId === teamId) {
					draftState.game.playerDatas[player.id].isAlive = false;
				}
			}
		});
	});

	Socket.registerReceiver(ReceiveCode.BOARD_CLEAR, reader => {
		update(draftState => {
			draftState.game = undefined;
		});
	});
}
