import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { original, produce } from 'immer';

export type Color = [number, number, number];

export type Player = {
	id: number;
	color: Color;
	name: string;
};

export type Team = {
	id: number;
	name: string;
};

export type Board = {
	width: number;
	height: number;
	board: number[];
	flags: number[];
	revealed: boolean[];
};

export type Cursor = {
	x: number;
	y: number;
	playerId: number;
};

export type GameState = {
	board: Board;
	gameTimer: number;
	isNoGuessing: boolean;
	cursorUpdateRate: number;
	cursors: Cursor[];
};

export type GlobalState = {
	players: Player[];
	teams: Team[];
	selfPlayerId: number | undefined;
	game: GameState | undefined;
};

const initialGlobalState: GlobalState = {
	players: [],
	teams: [],
	selfPlayerId: undefined,
	game: undefined,
};

const useGameState = create(
	combine({ ...initialGlobalState }, set => ({
		setSelfPlayerId: (selfPlayerId: number | undefined) =>
			set(
				produce((state: GlobalState) => {
					state.selfPlayerId = selfPlayerId;
				}),
			),
		setPlayers: (players: Player[]) =>
			set(
				produce((state: GlobalState) => {
					state.players = players;
				}),
			),
		updatePlayer: (player: Player) =>
			set(
				produce((state: GlobalState) => {
					const list = original(state.players);
					if (list === undefined) return;
					const index = list.findIndex(({ id }) => id === player.id);

					state.players[index] = player;
				}),
			),
	})),
);
