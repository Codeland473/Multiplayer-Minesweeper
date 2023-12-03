import React from 'react';
import { BoardStyle } from './BoardComponent.css.js';
import { Board, Player } from '../global-state.js';
import { rgbToHex } from '../util.js';
import { styleVariants } from '@vanilla-extract/css';

const Revealed = ({ x, y }: { x: number; y: number }) => {
	return (
		<>
			<rect
				className={BoardStyle.tileBack}
				x={x + 1}
				y={y + 1}
				width="15"
				height="15"
			/>
			<polygon
				className={BoardStyle.tileDark}
				points={`${x} ${y} ${x + 16} ${y + 0} ${x + 16} ${y + 1} ${
					x + 1
				} ${y + 1} ${x + 1} ${y + 16} ${x} ${y + 16} ${x} ${y}`}
			/>
		</>
	);
};

const Covered = ({ x, y }: { x: number; y: number }) => {
	return (
		<>
			<rect
				className={BoardStyle.tileBack}
				x={x + 2}
				y={y + 2}
				width="12"
				height="12"
			/>
			<polygon
				className={BoardStyle.tileDark}
				points={`${x + 0} ${y + 16} ${x + 2} ${y + 14} ${x + 14} ${
					y + 14
				} ${x + 14} ${y + 2} ${x + 16} ${y + 0} ${x + 16} ${y + 16} ${
					x + 0
				} ${y + 16}`}
			/>
			<polygon
				className={BoardStyle.tileLight}
				points={`${x + 16} ${y + 0} ${x + 14} ${y + 2} ${x + 2} ${
					y + 2
				} ${x + 2} ${y + 14} ${x + 0} ${y + 16} ${x + 0} ${y + 0} ${
					x + 16
				} ${y + 0}`}
			/>
		</>
	);
};

const Flag = ({
	x,
	y,
	color,
	isPencil,
}: {
	x: number;
	y: number;
	color: string;
	isPencil: boolean;
}) => {
	return (
		<polygon
			style={
				isPencil
					? { stroke: color, fill: 'none' }
					: { stroke: 'none', fill: color }
			}
			points={`${x + 10.93} ${y + 7.99} ${x + 10.93} ${y + 12} ${
				x + 7.46
			} ${y + 10} ${x + 4} ${y + 7.99} ${x + 7.46} ${y + 6} ${
				x + 10.93
			} ${y + 4} ${x + 10.93} ${y + 7.99}`}
		/>
	);
};

const StartingMarker = ({ x, y }: { x: number; y: number }) => {
	return (
		<>
			<line
				className={BoardStyle.startingLine}
				x1={x + 5}
				y1={y + 11}
				x2={x + 11}
				y2={y + 5}
			/>
			<line
				className={BoardStyle.startingLine}
				x1={x + 5}
				y1={y + 5}
				x2={x + 11}
				y2={y + 11}
			/>
		</>
	);
};

const Mine = ({ x, y }: { x: number; y: number }) => {
	return (
		<>
			<circle
				className={BoardStyle.mineBody}
				cx={x + 8}
				cy={y + 8}
				r="4"
			/>
			<line
				className={BoardStyle.mineLine}
				x1={x + 8}
				y1={y + 3}
				x2={x + 8}
				y2={y + 13}
			/>
			<line
				className={BoardStyle.mineLine}
				x1={x + 4.46}
				y1={y + 4.46}
				x2={x + 11.54}
				y2={y + 11.54}
			/>
			<line
				className={BoardStyle.mineLine}
				x1={x + 3}
				y1={y + 8}
				x2={x + 13}
				y2={y + 8}
			/>
			<line
				className={BoardStyle.mineLine}
				x1={x + 4.46}
				y1={y + 11.54}
				x2={x + 11.54}
				y2={y + 4.46}
			/>
		</>
	);
};

type MineCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
const isMineCount = (number: number): number is MineCount => {
	return number >= 1 && number <= 8;
};

type TileProps = {
	x: number;
	y: number;
	value: number;
	revealed: boolean;
	flagColor: string | undefined;
	isPencil: boolean;
	showMines: boolean;
	isStarting: boolean;
};

const Tile = ({
	x,
	y,
	value,
	revealed,
	flagColor,
	isPencil,
	showMines,
	isStarting,
}: TileProps) => {
	if (revealed) {
		return (
			<>
				<Revealed x={x} y={y} />
				{value === 9 ? (
					<Mine x={x} y={y} />
				) : isMineCount(value) ? (
					<text
						x={x + 8}
						y={y + 8}
						className={BoardStyle.number[value]}
					>
						{value}
					</text>
				) : null}
			</>
		);
	} else {
		return (
			<>
				<Covered x={x} y={y} />
				{showMines && value === 9 ? (
					<Mine x={x} y={y} />
				) : flagColor !== undefined ? (
					<Flag color={flagColor} x={x} y={y} isPencil={isPencil} />
				) : !revealed && isStarting ? (
					<StartingMarker x={x} y={y} />
				) : null}
			</>
		);
	}
};

export type BoardProps = {
	board: Board;
	flags: readonly number[];
	revealed: readonly boolean[];
	showMines: boolean;
	players: readonly Player[];
	onClick: (x: number, y: number, button: number) => void;
};

export const BoardComponent = ({
	board: inBoard,
	flags,
	revealed,
	showMines,
	players,
	onClick,
}: BoardProps) => {
	const { width, height, board, startX, startY } = inBoard;

	const flagColors = React.useMemo(
		() =>
			Object.assign(
				{},
				...players.map(({ id, color: [red, green, blue] }) => {
					return { [id]: rgbToHex(red, green, blue) };
				}),
			),
		[players],
	);

	const onClickSvg = React.useCallback(
		(event: React.MouseEvent) => {
			const rect = event.currentTarget.getBoundingClientRect();
			const x = Math.floor(
				((event.clientX - rect.x) / rect.width) * width,
			);
			const y = Math.floor(
				((event.clientY - rect.y) / rect.height) * height,
			);
			onClick(x, y, event.button);
		},
		[height, onClick, width],
	);

	return (
		<svg onClick={onClickSvg} viewBox={`0 0 ${width * 16} ${height * 16}`}>
			{board.map((value, index) => {
				const x = (index % width) * 16;
				const y = Math.floor(index / width) * 16;

				return (
					<Tile
						key={index}
						flagColor={flagColors[flags[index]]}
						isPencil={flags[index] < 0}
						revealed={revealed[index]}
						showMines={showMines}
						value={value}
						x={x}
						y={y}
						isStarting={x === startX && y === startY}
					/>
				);
			})}
		</svg>
	);
};
