import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { Draft, Immutable, nothing, produce } from 'immer';
import { Log } from './log.js';

export type Color = Immutable<[number, number, number]>;

export type Player = Immutable<{
	id: number;
	color: Color;
	name: string;
	teamId: number | undefined;
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

export type Board = Immutable<{
	width: number;
	height: number;
	board: number[];
	flags: number[];
	revealed: boolean[];
}>;

export type Cursor = Immutable<{
	x: number;
	y: number;
	playerId: number;
}>;

export type PlayerGameStats = Immutable<{
	alive: boolean;
}>;

export type TeamGameStats = Immutable<{
	alive: boolean;
}>;

export type Game = Immutable<{
	board: Board;
	settings: GameSettings;
	gameTimer: number;
	cursors: Cursor[];
	playersGameState: { [id: number]: PlayerGameStats };
	teamsGameState: { [id: number]: TeamGameStats };
}>;

export type GameSettings = Immutable<{
	isNoGuessing: boolean;
	isSuddenDeath: boolean;
	boardWidth: number;
	boardHeight: number;
	mineCount: number;
}>;

export type ConnectionStatus = 'loading' | 'connected' | 'error';

export type ConnectionState = Immutable<{
	status: ConnectionStatus;
	error: ErrorState | undefined;
}>;

export type ErrorState = Immutable<{
	message: string;
	timeout: number;
	lastTime: number;
}>;

export type GlobalState = Immutable<{
	playerCache: CachedPlayer[];
	gameSettings: GameSettings | undefined;
	players: Player[];
	teams: Team[];
	selfPlayerId: number | undefined;
	game: Game | undefined;
	log: Log.Item[];
	connectionState: ConnectionState;
}>;

const initialGlobalState: GlobalState = {
	playerCache: [],
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

export const useGlobalState = create(
	combine({ ...initialGlobalState }, set => ({})),
);

export const update = (
	updater: (state: Draft<GlobalState>) => void | GlobalState | typeof nothing,
) => {
	useGlobalState.setState(produce(updater));
};
