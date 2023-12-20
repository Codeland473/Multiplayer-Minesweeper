import { create } from 'zustand';
import { combine, createJSONStorage, persist } from 'zustand/middleware';
import { Draft, Immutable, nothing, produce } from 'immer';
import { Log } from './log.js';
import { AllOrNothing, Define, Undefine } from './util.js';
import React from 'react';

export type Color = Immutable<[number, number, number]>;

export type Player = Immutable<{
	id: number;
	color: Color;
	name: string;
	teamId: number | undefined;
	isConnected: boolean;
}>;

export type CachedPlayer = Immutable<
	Player & {
		cacheTimestamp: number;
	}
>;

export type Team = Immutable<{
	id: number;
	name: string;
}>;

export type Cursor = Immutable<{
	x: number;
	y: number;
	playerId: number;
}>;

export type PlayerData = Immutable<{
	isAlive: boolean;
}>;
export type PlayerDatas = Immutable<Record<number, PlayerData>>;

export type TeamProgress = Immutable<{
	flags: number[];
	board: number[];
}>;

export type TeamData = Immutable<{
	isAlive: boolean;
	finishTime: number | undefined;
}> &
	AllOrNothing<TeamProgress>;

export type HiddenTeamData = Undefine<TeamData, keyof TeamProgress>;
export type ShownTeamData = Define<TeamData, keyof TeamProgress>;
export type TeamDatas = Immutable<Record<number, TeamData>>;

export type StartingPosition = Immutable<[number, number]>;

export type Game = Immutable<{
	settings: GameSettings;
	startingPosition: StartingPosition | undefined;
	startTime: number;
	cursors: Cursor[];
	playerDatas: { [id: number]: PlayerData };
	teamDatas: { [id: number]: TeamData };
}>;

export type GameSettings = Immutable<{
	isNoGuessing: boolean;
	isSuddenDeath: boolean;
	width: number;
	height: number;
	mineCount: number;
	countdownLength: number;
}>;

export type ConnectionStatus = 'loading' | 'connected' | 'error';

export type ConnectionState = Immutable<{
	status: ConnectionStatus;
	error: ErrorState | undefined;
}>;

export type ErrorState = Immutable<{
	timeout: number;
	lastTime: number;
}>;

export type GlobalState = Immutable<{
	gameSettings: GameSettings | undefined;
	players: Player[];
	teams: Team[];
	selfPlayerId: number | undefined;
	game: Game | undefined;
	log: Log.Item[];
	connectionState: ConnectionState;
}>;

const initialGlobalState: GlobalState = {
	gameSettings: undefined,
	players: [],
	teams: [],
	selfPlayerId: undefined,
	game: undefined,
	log: [],
	connectionState: {
		status: 'loading',
		error: undefined,
	},
};

const reconstructPlayer = (raw: unknown): Draft<Player> | undefined => {
	if (raw === null || typeof raw !== 'object') return undefined;

	const { id, color, name, teamId } = raw as Record<string, unknown>;

	if (
		typeof id !== 'number' ||
		!(
			Array.isArray(color) &&
			typeof color[0] === 'number' &&
			typeof color[1] === 'number' &&
			typeof color[2] === 'number'
		) ||
		typeof name !== 'string' ||
		!(teamId === undefined || typeof teamId === 'number')
	)
		return undefined;

	return {
		id,
		color: color as [number, number, number],
		name,
		teamId,
		isConnected: true,
	};
};

export const useGlobalState = create(
	persist(
		combine({ ...initialGlobalState }, set => ({})),
		{
			name: 'global-state',
			partialize: state => {
				const selfPlayer = state.players.find(
					({ id }) => id === state.selfPlayerId,
				);
				if (selfPlayer === undefined) return {};
				return selfPlayer;
			},
			merge: (persisted, current) => {
				const selfPlayer = reconstructPlayer(persisted);
				return produce(current, state => {
					if (selfPlayer !== undefined) {
						state.players = [selfPlayer];
						state.selfPlayerId = selfPlayer.id;
					}
					state.players =
						selfPlayer === undefined ? [] : [selfPlayer];
				});
			},
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const update = (
	updater: (state: Draft<GlobalState>) => void | GlobalState | typeof nothing,
) => {
	useGlobalState.setState(produce(updater));
};

export const useConnectedPlayers = (): Player[] => {
	const players = useGlobalState(state => state.players);
	const connectedPlayers = React.useMemo(
		() => players.filter(({ isConnected }) => isConnected),
		[players],
	);

	return connectedPlayers;
};
