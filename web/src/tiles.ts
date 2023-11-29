import { Draft } from 'immer';
import { PlayerGameStats, TeamGameStats } from './globalState.js';

const toIndex = (x: number, y: number, width: number): number => y * width + x;

const toIndexSafe = (
	x: number,
	y: number,
	width: number,
	height: number,
): number | undefined =>
	x < 0 || y < 0 || x >= width || y >= height ? undefined : y * width + x;

const getFlagsAround = (
	flags: readonly number[],
	width: number,
	height: number,
	x: number,
	y: number,
): number => {
	let count = 0;

	if (x > 0 && flags[toIndex(x - 1, y, width)] !== 0) ++count;
	if (x < width - 1 && flags[toIndex(x + 1, y, width)] !== 0) ++count;
	if (y > 0 && flags[toIndex(x, y - 1, width)] !== 0) ++count;
	if (y < height - 1 && flags[toIndex(x, y + 1, width)] !== 0) ++count;

	if (x > 0 && y > 0 && flags[toIndex(x - 1, y - 1, width)] !== 0) ++count;
	if (x > 0 && y < height - 1 && flags[toIndex(x - 1, y + 1, width)] !== 0)
		++count;

	if (x < width - 1 && y > 0 && flags[toIndex(x + 1, y - 1, width)] !== 0)
		++count;
	if (
		x < width - 1 &&
		y < height - 1 &&
		flags[toIndex(x + 1, y + 1, width)] !== 0
	)
		++count;

	return count;
};

const revealChord = (
	x: number,
	y: number,
	width: number,
	height: number,
	flags: readonly number[],
	revealed: Draft<boolean[]>,
) => {
	const left = Math.max(x - 1, 0);
	const right = Math.min(x + 1, width - 1);
	const up = Math.max(y - 1, 0);
	const down = Math.min(y + 1, height - 1);

	for (let j = up; j <= down; ++j) {
		for (let i = left; i <= right; ++i) {
			const index = toIndex(i, j, width);
			if (flags[index] === 0) {
				revealed[index] = true;
			}
		}
	}
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
const reveal = (
	x: number,
	y: number,
	width: number,
	height: number,
	board: readonly number[],
	flags: Draft<number[]>,
	revealed: Draft<boolean[]>,
	PlayerGameStats: Draft<PlayerGameStats>,
) => {
	const stack: number[] = [toIndex(x, y, width)];

	const pushSafe = (index: number | undefined) => {
		if (index !== undefined) stack.push(index);
	};

	let topIndex: number | undefined;
	while ((topIndex = stack.pop()) !== undefined) {
		/* already revealed */
		if (revealed[topIndex]) continue;

		if (board[topIndex] === 0) {
			const x = topIndex % width;
			const y = Math.floor(topIndex / width);
			
			const left = Math.max(x - 1, 0);
			const right = Math.min(x + 1, width - 1);
			const up = Math.max(y - 1, 0);
			const down = Math.min(y + 1, height - 1);
	
			for (let j = up; j <= down; ++j) {
				for (let i = left; i <= right; ++i) {
					const index = toIndex(i, j, width);
	
					flags[index] = 0;
					revealed[index] = true;
	
					const value = board[index];
					if (value === 0) {
						pushSafe(toIndexSafe(x - 1, y, width, height));
						pushSafe(toIndexSafe(x + 1, y, width, height));
						pushSafe(toIndexSafe(x - 1, y - 1, width, height));
						pushSafe(toIndexSafe(x + 1, y - 1, width, height));
						pushSafe(toIndexSafe(x, y - 1, width, height));
						pushSafe(toIndexSafe(x - 1, y + 1, width, height));
						pushSafe(toIndexSafe(x + 1, y + 1, width, height));
					}
				}
			}
		} else if (board[topIndex] === 9) {
			flags[topIndex] = 0;
			revealed[topIndex] = true;

			
		} else {
			flags[topIndex] = 0;
			revealed[topIndex] = true;

			if () {

			}
		}
	}
};
