import { Draft } from 'immer';
import {
	Game,
	Player,
	ActiveTeamData,
	TeamData,
	Board,
} from './globalState.js';
import { imm } from './util.js';

const toIndex = (x: number, y: number, width: number): number => y * width + x;
const toXY = (index: number, width: number) =>
	[index % width, Math.floor(index / width)] as const;

export const isInbounds = (
	x: number,
	y: number,
	width: number,
	height: number,
): boolean => {
	return x >= 0 && y >= 0 && x < width && y < height;
};

export const isInboundsBoard = (
	x: number,
	y: number,
	board: Board,
): boolean => {
	return x >= 0 && y >= 0 && x < board.width && y < board.height;
};

const indicesAround = (
	x: number,
	y: number,
	width: number,
	height: number,
): readonly number[] => {
	const indices: number[] = [];

	if (x >= 0) {
		indices.push(toIndex(x - 1, y, width));
		if (y >= 0) indices.push(toIndex(x - 1, y - 1, width));
		if (y < height) indices.push(toIndex(x - 1, y + 1, width));
	}
	if (x < width) {
		indices.push(toIndex(x + 1, y, width));
		if (y >= 0) indices.push(toIndex(x + 1, y - 1, width));
		if (y < height) indices.push(toIndex(x + 1, y + 1, width));
	}
	if (y >= 0) indices.push(toIndex(x, y - 1, width));
	if (y < height) indices.push(toIndex(x, y + 1, width));

	return indices;
};

const getTeamPlayers = (
	players: readonly Player[],
	teamId: number,
): readonly Player[] => {
	return players.filter(player => player.teamId === teamId);
};

export const countFlagsAround = (
	x: number,
	y: number,
	width: number,
	height: number,
	flags: readonly number[],
): number => {
	let count = 0;

	for (const index of indicesAround(x, y, width, height)) {
		if (flags[index]) ++count;
	}

	return count;
};

export const lose = (
	draftGame: Draft<Game>,
	players: readonly Player[],
	playerId: number,
) => {
	const game = imm(draftGame);

	draftGame.playerDatas[playerId].alive = false;
	const player = players.find(({ id }) => id === playerId)!;

	const allTeamPlayers = getTeamPlayers(players, player.id);
	if (allTeamPlayers.every(({ id }) => !game.teamDatas[id].alive)) {
		draftGame.teamDatas[player.teamId!].alive = false;
	}
};

export const isActiveTeamData = (
	teamData: TeamData | undefined,
): teamData is ActiveTeamData => {
	if (teamData === undefined) return false;
	return teamData.revealed !== undefined;
};

/**
 *
 * @param x
 * @param y
 * @param width
 * @param height
 * @param board
 * @param flags
 * @param revealed
 */
export const reveal = (
	x: number,
	y: number,
	draftGame: Draft<Game>,
	draftTeamData: Draft<ActiveTeamData>,
	isChord: boolean,
): boolean => {
	const { revealed, flags } = imm(draftTeamData);
	const { width, height, board } = draftGame.board;

	const stack: number[] = [];

	/* initial tiles to reveal from click */
	if (isChord) {
		for (const aroundIndex of indicesAround(x, y, width, height)) {
			if (flags[aroundIndex] === 0 && !revealed[aroundIndex])
				stack.push(aroundIndex);
		}
	} else {
		const revealIndex = toIndex(x, y, width);
		if (!revealed[revealIndex]) stack.push(revealIndex);
	}

	/* recursively reveal tiles */
	let topIndex: number | undefined;
	while ((topIndex = stack.pop()) !== undefined) {
		if (board[topIndex] === 0) {
			const [x, y] = toXY(topIndex, width);

			for (const aroundIndex of indicesAround(x, y, width, height)) {
				const [x, y] = toXY(aroundIndex, width);

				draftTeamData.flags[aroundIndex] = 0;
				draftTeamData.revealed[aroundIndex] = true;

				const value = board[aroundIndex];
				if (value === 0) {
					for (const spreadIndex of indicesAround(
						x,
						y,
						width,
						height,
					)) {
						if (!revealed[spreadIndex]) stack.push(spreadIndex);
					}
				}
			}
		} else if (board[topIndex] === 9) {
			draftTeamData.flags[topIndex] = 0;
			draftTeamData.revealed[topIndex] = true;
			return true;
		} else {
			draftTeamData.flags[topIndex] = 0;
			draftTeamData.revealed[topIndex] = true;
		}
	}

	return false;
};

export const setFlag = (
	x: number,
	y: number,
	draftGame: Draft<Game>,
	draftTeamData: Draft<ActiveTeamData>,
	playerId: number,
	isFlagAdded: boolean,
	isPencil: boolean,
) => {
	const game = imm(draftGame);
	const index = toIndex(x, y, game.board.width);

	draftTeamData.flags[index] = isFlagAdded
		? isPencil
			? -playerId
			: playerId
		: 0;
};
