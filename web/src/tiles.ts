import { Draft } from 'immer';
import { Game, Player, ShownTeamData, TeamData } from './global-state.js';
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
	{ width, height }: { width: number; height: number },
): boolean => {
	return x >= 0 && y >= 0 && x < width && y < height;
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

export const isMarkedAsMine = (flag: number, tile: number) =>
	flag > 0 || tile === 9;
export const isRevealedSafe = (tile: number) => tile >= 0 && tile <= 8;
export const isCovered = (tile: number) => tile === 10;
export const isAnyFlagged = (flag: number) => flag !== 0;

export const countFlagsCoveredAround = (
	x: number,
	y: number,
	width: number,
	height: number,
	flags: readonly number[],
	board: readonly number[],
): [number, number] => {
	let flagCount = 0;
	let coveredCount = 0;

	for (const index of indicesAround(x, y, width, height)) {
		if (isMarkedAsMine(flags[index], board[index])) ++flagCount;
		else if (isCovered(board[index])) ++coveredCount;
	}

	return [flagCount, coveredCount];
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
	return teamData.board !== undefined;
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
	width: number,
	height: number,
	draftTeamData: Draft<ShownTeamData>,
	isChord: boolean,
) => {
	if (isChord) {
		for (const aroundIndex of indicesAround(x, y, width, height)) {
			if (
				!isMarkedAsMine(
					draftTeamData.flags[aroundIndex],
					draftTeamData.board[aroundIndex],
				) &&
				isCovered(draftTeamData.board[aroundIndex])
			) {
				draftTeamData.board[aroundIndex] = 0;
			}
		}
	} else {
		const revealIndex = toIndex(x, y, width);
		if (isCovered(draftTeamData.board[revealIndex])) {
			draftTeamData.board[revealIndex] = 0;
		}
	}
};

export const setFlag = (
	x: number,
	y: number,
	width: number,
	draftTeamData: Draft<ShownTeamData>,
	playerId: number,
	isFlagAdded: boolean,
	isPencil: boolean,
) => {
	draftTeamData.flags[toIndex(x, y, width)] = isFlagAdded
		? isPencil
			? -playerId
			: playerId
		: 0;
};

export enum ClickResultType {
	REVEAL,
	FLAG,
}

export type ClickResult = {
	x: number;
	y: number;
} & (
	| {
			type: ClickResultType.REVEAL;
			isChord: boolean;
	  }
	| {
			type: ClickResultType.FLAG;
			isAdd: boolean;
			isPencil: boolean;
	  }
);

export const processClickResult = (
	draftGame: Draft<Game>,
	draftTeamData: Draft<ShownTeamData>,
	playerId: number,
	clickResult: ClickResult | undefined,
) => {
	if (clickResult === undefined) return;

	const { width, height } = draftGame.settings;

	if (clickResult.type === ClickResultType.REVEAL) {
		reveal(
			clickResult.x,
			clickResult.y,
			width,
			height,
			draftTeamData,
			clickResult.isChord,
		);
	} else {
		setFlag(
			clickResult.x,
			clickResult.y,
			width,
			draftTeamData,
			playerId,
			clickResult.isAdd,
			clickResult.isPencil,
		);
	}
};

export const getClickResult = (
	x: number,
	y: number,
	button: number,
	game: Game,
	teamData: ShownTeamData,
): ClickResult | undefined => {
	const { flags, board } = teamData;
	const {
		startingPosition,
		settings: { width, height },
	} = game;

	const clickIndex = toIndex(x, y, width);

	/* must start on start, can't flag start */
	if (startingPosition !== undefined) {
		const startIndex = toIndex(...startingPosition, width);
		if (
			isCovered(board[startIndex]) && button === 0
				? clickIndex !== startIndex
				: clickIndex === startIndex
		)
			return undefined;
	}

	if (button === 0) {
		const value = board[clickIndex];

		/* already flagged do nothing */
		if (isAnyFlagged(flags[clickIndex])) return undefined;

		if (isCovered(board[clickIndex])) {
			return { type: ClickResultType.REVEAL, isChord: false, x, y };
		} else {
			/* no chords on empty tile */
			if (value === 0) return undefined;

			const [flagCount, coveredCount] = countFlagsCoveredAround(
				x,
				y,
				width,
				height,
				flags,
				board,
			);

			/* chord doesn't match flagged tiles or no tiles to reveal */
			if (flagCount !== value || coveredCount === 0) return undefined;

			return { type: ClickResultType.REVEAL, isChord: true, x, y };
		}
	} else if (button === 1 || button === 2) {
		if (!isCovered(board[clickIndex])) return undefined;

		const isPencil = button === 1;
		const isAdd = !isAnyFlagged(flags[clickIndex]);

		return { type: ClickResultType.FLAG, isAdd, isPencil, x, y };
	} else {
		return undefined;
	}
};
