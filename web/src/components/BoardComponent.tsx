import React from 'react';
import { BoardStyle } from './BoardComponent.css.js';
import {
	GameSettings,
	Player,
	ShownTeamData,
	StartingPosition,
} from '../global-state.js';
import { rgbToHex } from '../util.js';

const Covered = ({ x, y }: { x: number; y: number }) => {
	return (
		<>
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
	flagColor: string | undefined;
	isPencil: boolean;
	isStarting: boolean;
	isHovered: boolean;
};

const Tile = ({ x, y, value, flagColor, isPencil, isStarting, isHovered }: TileProps) => {
	const isCovered = value === 10;
	const shouldIndent = isCovered && isHovered && flagColor === undefined;

	return (
		<>
			{isCovered && !shouldIndent ? <Covered x={x} y={y} /> : null}
			{value === 9 ? (
				<Mine x={x} y={y} />
			) : isMineCount(value) ? (
				<text x={x + 8} y={y + 8} className={BoardStyle.number[value]}>
					{value}
				</text>
			) : flagColor !== undefined ? (
				<Flag color={flagColor} x={x} y={y} isPencil={isPencil} />
			) : isCovered && isStarting ? (
				<StartingMarker x={x} y={y} />
			) : null}
		</>
	);
};

const GridLines = ({ width, height }: { width: number; height: number }) => {
	const lines: React.ReactNode[] = [];

	for (let i = 0; i < width; ++i) {
		lines.push(
			<rect
				key={`x${i}`}
				x={i * 16}
				y={0}
				width={1}
				height={height * 16}
				className={BoardStyle.tileDark}
			/>,
		);
	}

	for (let j = 0; j < height; ++j) {
		lines.push(
			<rect
				key={`y${j}`}
				x={0}
				y={j * 16}
				width={width * 16}
				height={1}
				className={BoardStyle.tileDark}
			/>,
		);
	}

	return lines;
};

export type BoardProps = {
	gameSettings: GameSettings;
	teamData: ShownTeamData;
	startingPosition: StartingPosition | undefined;
	showMines: boolean;
	players: readonly Player[];
	onClick: (x: number, y: number, button: number) => void;
};

export const BoardComponent = ({
	gameSettings,
	startingPosition,
	teamData,
	showMines,
	players,
	onClick,
}: BoardProps) => {
	const { board, flags } = teamData;
	const { width, height } = gameSettings;

	const [hoverTarget, setHoverTarget] = React.useState<[number, number] | undefined>(undefined);

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

	const getBoardCoordinates = (event: React.MouseEvent) => {
		const rect = event.currentTarget.getBoundingClientRect();

		const rectRatio = rect.width / rect.height;
		const boardRatio = width / height;

		let offX = 0;
		let offY = 0;
		let displayWidth = 0;
		let displayHeight = 0;

		if (rectRatio > boardRatio) {
			offY = 0;
			displayHeight = rect.height;
			displayWidth = displayHeight * boardRatio;
			offX = (rect.width - displayWidth) / 2;
		} else {
			offX = 0;
			displayWidth = rect.width;
			displayHeight = displayWidth * (1 / boardRatio);
			offY = (rect.height - displayHeight) / 2;
		}

		const x = Math.floor(
			((event.clientX - rect.x - offX) / displayWidth) * width,
		);
		const y = Math.floor(
			((event.clientY - rect.y - offY) / displayHeight) * height,
		);
		return {x, y};
	}

	const onClickSVG = React.useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			if (event.button < 0 || event.button > 2) return;

			const {x, y} = getBoardCoordinates(event);

			if (x < 0 || x >= width || y < 0 || y >= height) return;

			onClick(x, y, event.button);
		},
		[onClick, width, height],
	);

	const onMouseMoveEventSVG = React.useCallback((event: React.MouseEvent) => {
		const leftButtonDown = (event.buttons & 1) > 0
		const {x, y} = getBoardCoordinates(event);
		
		if (!leftButtonDown || x < 0 || x >= width || y < 0 || y >= height) {
			setHoverTarget(undefined);
		} else {
			setHoverTarget([x, y]);
		}

	}, [width, height])

	const preventer = React.useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
	}, []);
	return (
		<svg
			onClick={onClickSVG}
			onContextMenu={preventer}
			onAuxClick={onClickSVG}
			onMouseMove={onMouseMoveEventSVG}
			onMouseDown={onMouseMoveEventSVG}
			onMouseUp={onMouseMoveEventSVG}
			viewBox={`0 0 ${width * 16} ${height * 16}`}
			className={BoardStyle.svg}
		>
			<GridLines width={width} height={height} />
			{board.map((value, index) => {
				const x = index % width;
				const y = Math.floor(index / width);
				const flagPlayerId =
					flags[index] === 0 ? undefined : Math.abs(flags[index]);

				const [hoverX, hoverY] = hoverTarget === undefined ? [-2, -2] : hoverTarget
				const isHovered = (x == hoverX && y == hoverY) ||
					(board[hoverY * width + hoverX] != 10 && Math.abs(x - hoverX) <= 1 && Math.abs(y - hoverY) <= 1)
				return (
					<Tile
						key={index}
						flagColor={
							flagPlayerId === undefined
								? undefined
								: flagColors[flagPlayerId]
						}
						isPencil={flags[index] < 0}
						value={value}
						x={x * 16}
						y={y * 16}
						isStarting={
							startingPosition !== undefined &&
							x === startingPosition[0] &&
							y === startingPosition[1]
						}
						isHovered={isHovered}
					/>
				);
			})}
		</svg>
	);
};
