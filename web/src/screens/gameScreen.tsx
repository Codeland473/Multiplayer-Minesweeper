import React from 'react';
import { Game, TeamData, update, useGlobalState } from '../globalState.js';
import { Board } from '../components/board.js';
import { Sender } from '../socket/sender.js';
import { handleClickTile, isShownTeamData } from '../tiles.js';

export const GameScreen = () => {
	const game = useGlobalState(state => state.game)!;
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);
	const players = useGlobalState(state => state.players);

	const selfPlayer = players.find(({ id }) => id === selfPlayerId)!;
	if (selfPlayer.teamId === undefined) throw Error('spec not impl');

	const gameState = game.teamDatas[selfPlayer.teamId];

	const gameRef = React.useRef<Game>(game);
	gameRef.current = game;

	const gameStateRef = React.useRef<TeamData>(gameState);
	gameStateRef.current = gameState;

	const onClickBoard = React.useCallback(
		(x: number, y: number, button: number) => {
			update(draftState => {
				if (draftState.game === undefined) return;
				if (selfPlayer.teamId === undefined) return;
				const teamData = draftState.game.teamDatas[selfPlayer.teamId];
				if (!isShownTeamData(teamData)) return;

				handleClickTile(
					x,
					y,
					button,
					draftState.game,
					teamData,
					selfPlayer.id,
				);
			});
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
						showMines={!gameState.isAlive}
						players={players}
						onClick={onClickBoard}
					/>
				)}
			</div>
		</div>
	);
};
