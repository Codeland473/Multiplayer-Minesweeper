import React from 'react';
import { Game, TeamGameStats, useGlobalState } from '../globalState.js';
import { Board } from '../components/board.js';
import { Sender } from '../socket/sender.js';

const toIndex = (x: number, y: number, width: number): number => y * width + x;

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

export const GameScreen = () => {
	const game = useGlobalState(state => state.game)!;
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);
	const players = useGlobalState(state => state.players);

	const selfPlayer = players.find(({ id }) => id === selfPlayerId)!;
	if (selfPlayer.teamId === undefined) throw Error('spec not impl');

	const gameState = game.teamsGameState[selfPlayer.teamId];

	const gameRef = React.useRef<Game>(game);
	gameRef.current = game;

	const gameStateRef = React.useRef<TeamGameStats>(gameState);
	gameStateRef.current = gameState;

	const onClickBoard = React.useCallback(
		(x: number, y: number, button: number) => {
			const { board, width, height } = gameRef.current.board;
			const index = toIndex(x, y, width);
			const { alive, flags, revealed } = gameStateRef.current;

			if (flags === undefined || revealed === undefined) return;
			if (!alive) return;

			if (button === 0) {
				const value = board[index];

				/* already flagged do nothing */
				if (flags[index] !== 0) return;

				if (revealed[index]) {
					/* do nothing on empty square */
					if (value === 0) return;

					const flagsAround = getFlagsAround(
						flags,
						width,
						height,
						x,
						y,
					);

					/* do nothing on random number click */
					if (flagsAround !== value) return;

					/* chord */
					Sender.revealTile(x, y);
				} else {
					//if (value === 0)
				}
			} else if (button === 1) {
			}
		},
		[],
	);

	return (
		<div>
			<div>
				{gameState.revealed === undefined ||
				gameState.flags === undefined ? (
					<div>?</div>
				) : (
					<Board
						board={game.board.board}
						flags={gameState.flags}
						revealed={gameState.revealed}
						width={game.board.width}
						height={game.board.height}
						showMines={!gameState.alive}
						players={}
						onClick={onClickBoard}
					/>
				)}
			</div>
		</div>
	);
};
