import { LargeNumberLike } from 'crypto';
import React from 'react';

export type BoardProps = {
	board: number[];
	width: number;
	height: number;
};

const BOX_SIZE = 16;

type TileProps = {
	x: number;
	y: number;
	number: number;
	revealed: boolean;
	flagColor: string | undefined;
};

const Tile = ({ x, y, number, revealed, flagColor }: TileProps) => {
	const base = revealed ? (
		<>
			<rect
				x={x * BOX_SIZE}
				y={y * BOX_SIZE}
				width={BOX_SIZE}
				height={BOX_SIZE}
			/>
			<path
				d={`M 0 0 h ${BOX_SIZE} v 1 h ${-BOX_SIZE + 1} v ${
					BOX_SIZE - 1
				} h -1 Z`}
			/>
		</>
	) : (
		<>
			<rect
				x={x * BOX_SIZE}
				y={y * BOX_SIZE}
				width={BOX_SIZE}
				height={BOX_SIZE}
			/>
			<path
				d={`M 0 ${BOX_SIZE} h ${BOX_SIZE} v ${-BOX_SIZE} l -2 2 v ${
					BOX_SIZE - 2
				} h ${-BOX_SIZE + 2} Z`}
			/>
			<path
				d={`M 0 ${BOX_SIZE} l 2 -2 v ${-BOX_SIZE + 2} h ${
					BOX_SIZE - 2
				} l 2 -2 h ${-BOX_SIZE} Z`}
			/>
		</>
	);

	const flag =
		flagColor === undefined ? null : (
			<>
				<path></path>
			</>
		);

	return <path></path>;
};

export const Board = ({ board, width, height }: BoardProps) => {
	return (
		<svg viewBox={`0 0 ${width * BOX_SIZE} ${height * BOX_SIZE}`}>
			{board.map(() => 0)}
		</svg>
	);
};
