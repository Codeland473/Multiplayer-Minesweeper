import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { Immutable } from 'immer';
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

export type GameState = Immutable<{
	board: Board;
	gameTimer: number;
	isNoGuessing: boolean;
	cursorUpdateRate: number;
	cursors: Cursor[];
	playersGameState: { [id: number]: PlayerGameStats };
}>;

export type GlobalState = Immutable<{
	playerCache: CachedPlayer[];
	players: Player[];
	teams: Team[];
	selfPlayerId: number | undefined;
	game: GameState | undefined;
	log: Log.Item[];
}>;

const initialGlobalState: GlobalState = {
	playerCache: [],
	players: [],
	teams: [],
	selfPlayerId: undefined,
	game: undefined,
	log: [],
};

export const useGameState = create(
	combine({ ...initialGlobalState }, set => ({
		//setSelfPlayerId: (selfPlayerId: number | undefined) =>
		//	set(
		//		produce((state: GlobalState) => {
		//			state.selfPlayerId = selfPlayerId;
		//		}),
		//	),
		//setPlayers: (players: Player[]) =>
		//	set(
		//		produce((state: GlobalState) => {
		//			state.players = players;
		//		}),
		//	),
		//updatePlayer: (player: Player) =>
		//	set(
		//		produce((state: GlobalState) => {
		//			const list = original(state.players);
		//			if (list === undefined) return;
		//			const index = list.findIndex(({ id }) => id === player.id);
		//
		//			state.players[index] = player;
		//		}),
		//	),
	})),
);
