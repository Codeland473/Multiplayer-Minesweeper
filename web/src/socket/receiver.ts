import { original, type Draft, Immutable, castDraft } from 'immer';
import {
	Color,
	Cursor,
	Game,
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
import { ReceiveCode, SettingCode } from './protocol.js';

export namespace Receiver {
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

		const game: Game | undefined = gameGoing
			? (() => {
					const settings = readSettings(reader);
					const { boardWidth, boardHeight } = settings;

					const startTime = reader.getLong();
					const startX = reader.getInt();
					const startY = reader.getInt();

					const board = reader.getByteArray(boardWidth * boardHeight);

					const selfIndex = playerTeamIds.findIndex(
						teamId => teamId === selfPlayerId,
					);
					const isSpectator = playerTeamIds[selfIndex] === 0;

					const numTeamStates = isSpectator ? numTeams : 1;
					const revealedMasks = Data.readArray(numTeamStates, () =>
						reader.getBooleanArray(boardWidth * boardHeight),
					);
					const flagStates = Data.readArray(numTeamStates, () =>
						reader.getIntArray(boardWidth * boardHeight),
					);

					const cursors: Cursor[] = cursorLocations.map(
						([x, y], index) => {
							const playerId = playerIds[index];
							return { playerId, x, y };
						},
					);

					const playersGameState: { [id: number]: PlayerGameStats } =
						{};
					for (let i = 0; i < numPlayers; ++i) {
						playersGameState[playerIds[i]] = {
							alive: !playerIsDeads[i],
						};
					}

					const teamsGameState: { [id: number]: TeamGameStats } = {};
					for (let i = 0; i < numTeams; ++i) {
						const teamId = teamIds[i];

						if (isSpectator) {
							teamsGameState[teamId] = {
								alive: !teamIsDeads[i],
								flags: flagStates[teamId],
								revealed: revealedMasks[teamId],
							};
						} else {
							if (teamId === playerTeamIds[selfIndex]) {
								teamsGameState[teamId] = {
									alive: !teamIsDeads[i],
									flags: flagStates[0],
									revealed: revealedMasks[0],
								};
							} else {
								teamsGameState[teamId] = {
									alive: !teamIsDeads[i],
									flags: undefined,
									revealed: undefined,
								};
							}
						}
					}

					return {
						board: {
							board: Array.from(board),
							width: boardWidth,
							height: boardHeight,
							startX,
							startY,
						},
						teamsGameState,
						settings,
						startTime,
						cursors,
						playersGameState,
					} satisfies Game;
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

			state.game = castDraft(game);
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

	Socket.registerReceiver(ReceiveCode.GAME_START, reader => {
		const _fromPlayerId = reader.getInt();

		const startTime = reader.getLong();

		const startX = reader.getInt();
		const startY = reader.getInt();

		// i want these
		const board = reader.getByteArray(boardWidth * boardHeight);
	});

	Socket.registerReceiver(ReceiveCode.SQUARE_REVEAL, reader => {
		const _fromPlayerId = reader.getInt();

		const teamId = reader.getInt();
		const x = reader.getInt();
		const y = reader.getInt();

		update(state => {
			if (state.game === undefined) return;
			const { width, height } = state.game.board;
			if (x < 0 || y < 0 || x >= width || y >= height) return;

			const index = y * width + x;

			const teamGameStats = state.game.teamsGameState[teamId];
			if (teamGameStats === undefined) return;

			if (teamGameStats.revealed === undefined) return;
			teamGameStats.revealed[index] = true;
		});
	});

	Socket.registerReceiver(ReceiveCode.SQUARE_FLAG, reader => {});

	Socket.registerReceiver(ReceiveCode.CURSOR_UPDATE, reader => {});
}
