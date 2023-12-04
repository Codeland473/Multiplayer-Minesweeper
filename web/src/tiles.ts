import { Draft } from 'immer';
import {
	Game,
	Player,
	ShownTeamData,
	TeamData,
	Board,
} from './global-state.js';
import { imm } from './util.js';
import { Sender } from './socket/sender.js';

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

	if (x >= 1) {
		indices.push(toIndex(x - 1, y, width));
		if (y >= 1) indices.push(toIndex(x - 1, y - 1, width));
		if (y <= height - 2) indices.push(toIndex(x - 1, y + 1, width));
	}
	if (x <= width - 2) {
		indices.push(toIndex(x + 1, y, width));
		if (y >= 1) indices.push(toIndex(x + 1, y - 1, width));
		if (y <= height - 2) indices.push(toIndex(x + 1, y + 1, width));
	}
	if (y >= 1) indices.push(toIndex(x, y - 1, width));
	if (y <= height - 2) indices.push(toIndex(x, y + 1, width));

	return indices;
};

const getTeamPlayers = (
	players: readonly Player[],
	teamId: number,
): readonly Player[] => {
	return players.filter(player => player.teamId === teamId);
};

export const isFlagged = (flag: number) => {
	return flag > 0;
};
export const isAnyFlagged = (flag: number) => {
	return flag !== 0;
};

export const countFlagsCoveredAround = (
	x: number,
	y: number,
	width: number,
	height: number,
	flags: readonly number[],
	revealed: readonly boolean[],
): [number, number] => {
	let flagCount = 0;
	let revealCount = 0;

	for (const index of indicesAround(x, y, width, height)) {
		if (isFlagged(flags[index])) ++flagCount;
		else if (revealed[index]) ++revealCount;
	}

	return [flagCount, revealCount];
};

export const lose = (
	draftGame: Draft<Game>,
	players: readonly Player[],
	playerId: number,
) => {
	const game = imm(draftGame);

	draftGame.playerDatas[playerId].isAlive = false;
	const player = players.find(({ id }) => id === playerId)!;

	const allTeamPlayers = getTeamPlayers(players, player.id);
	if (allTeamPlayers.every(({ id }) => !game.teamDatas[id].isAlive)) {
		draftGame.teamDatas[player.teamId!].isAlive = false;
	}
};

export const isShownTeamData = (
	teamData: TeamData | undefined,
): teamData is ShownTeamData => {
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
	draftTeamData: Draft<ShownTeamData>,
	isChord: boolean,
): boolean => {
	const { width, height, board } = draftGame.board;

	const stack: number[] = [];

	/* initial tiles to reveal from click */
	if (isChord) {
		for (const aroundIndex of indicesAround(x, y, width, height)) {
			if (
				!isFlagged(draftTeamData.flags[aroundIndex]) &&
				!draftTeamData.revealed[aroundIndex]
			)
				stack.push(aroundIndex);
		}
	} else {
		const revealIndex = toIndex(x, y, width);
		if (!draftTeamData.revealed[revealIndex]) stack.push(revealIndex);
	}

	/* recursively reveal tiles */
	let topIndex: number | undefined;
	while ((topIndex = stack.pop()) !== undefined) {
		draftTeamData.flags[topIndex] = 0;
		draftTeamData.revealed[topIndex] = true;

		if (board[topIndex] === 9) {
			return true;
		} else if (board[topIndex] === 0) {
			for (const aroundIndex of indicesAround(
				...toXY(topIndex, width),
				width,
				height,
			)) {
				if (!draftTeamData.revealed[aroundIndex])
					stack.push(aroundIndex);
			}
		}
	}

	return false;
};

export const setFlag = (
	x: number,
	y: number,
	draftGame: Draft<Game>,
	draftTeamData: Draft<ShownTeamData>,
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

export const handleClickTile = (
	x: number,
	y: number,
	button: number,
	draftGame: Draft<Game>,
	draftTeamData: Draft<ShownTeamData>,
	playerId: number,
) => {
	const game = imm(draftGame);
	const teamData = imm(draftTeamData);

	const {
		board: { board, width, height, startX, startY },
	} = game;
	const clickIndex = toIndex(x, y, width);
	const { flags, revealed } = teamData;

	/* must start on start */
	if (startX !== undefined && startY !== undefined) {
		const startIndex = toIndex(startX, startY, width);
		if (clickIndex !== startIndex && !revealed[startIndex]) return;
	}

	if (button === 0) {
		const value = board[clickIndex];

		/* already flagged do nothing */
		if (isAnyFlagged(flags[clickIndex])) return;

		if (revealed[clickIndex]) {
			/* do nothing on empty square */
			if (value === 0) return;

			const [flagCount, coveredCount] = countFlagsCoveredAround(
				x,
				y,
				width,
				height,
				flags,
				revealed,
			);

			/* do nothing on random number click */
			if (flagCount !== value || coveredCount === 0) return;

			/* chord */
			reveal(x, y, draftGame, draftTeamData, true);
			//Sender.revealTile(x, y, true);
		} else {
			reveal(x, y, draftGame, draftTeamData, false);
			//Sender.revealTile(x, y, false);
		}
	} else if (button === 1 || button === 2) {
		const isPencil = button === 1;
		const placedFlagId = isPencil ? -playerId : playerId;

		if (revealed[clickIndex]) return;

		if (isAnyFlagged(flags[clickIndex])) {
			draftTeamData.flags[clickIndex] = 0;
			//Sender.flagTile(x, y, false, false);
		} else {
			draftTeamData.flags[clickIndex] = placedFlagId;
			//Sender.flagTile(x, y, true, isPencil);
		}
	}
};
