import React from 'react';
import { BoardStyle } from './board.css.js';
import { Player } from '../globalState.js';
import { rgbToHex } from '../util.js';

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

const Flag = ({ x, y, color }: { x: number; y: number; color: string }) => {
	return (
		<>
			<rect
				className={BoardStyle.flagPole}
				x={x + 10}
				y={y + 3}
				width="2"
				height="10"
			/>
			<polygon
				style={{ fill: color }}
				points={`${x + 10} ${y + 6.46} ${x + 10} ${y + 9.93} ${x + 7} ${
					y + 8.2
				} ${x + 4} ${y + 6.46} ${x + 7} ${y + 4.73} ${x + 10} ${
					y + 3
				} ${x + 10} ${y + 6.46}`}
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

type TileProps = {
	x: number;
	y: number;
	value: number;
	revealed: boolean;
	flagColor: string | undefined;
	showMines: boolean;
};

const Tile = ({ x, y, value, revealed, flagColor, showMines }: TileProps) => {
	const base = revealed ? <Revealed x={x} y={y} /> : <Covered x={x} y={y} />;
	const flag =
		flagColor === undefined ? null : <Flag color={flagColor} x={x} y={y} />;
	const number =
		value === 9 ? (
			showMines ? (
				<Mine x={x} y={y} />
			) : null
		) : value === 0 ? null : (
			<text x={x + 8} y={y + 8}>
				{value}
			</text>
		);

	return (
		<>
			{base}
			{flag}
			{number}
		</>
	);
};

export type BoardProps = {
	board: readonly number[];
	flags: readonly number[];
	revealed: readonly boolean[];
	width: number;
	height: number;
	showMines: boolean;
	players: readonly Player[];
	onClick: (x: number, y: number, button: number) => void;
};

export const Board = ({
	board,
	flags,
	revealed,
	width,
	height,
	showMines,
	players,
	onClick,
}: BoardProps) => {
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
						revealed={revealed[index]}
						showMines={showMines}
						value={value}
						x={x}
						y={y}
					/>
				);
			})}
		</svg>
	);
};
