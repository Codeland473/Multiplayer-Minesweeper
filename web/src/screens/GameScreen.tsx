import React from 'react';
import { TeamData, update, useGlobalState } from '../global-state.js';
import { BoardComponent } from '../components/BoardComponent.js';
import {
	ClickResult,
	ClickResultType,
	getClickResult,
	isShownTeamData,
	processClickResult,
} from '../tiles.js';
import { PlayerDisplay } from '../components/PlayerDisplay.js';
import { Sender } from '../socket/sender.js';

const sendClickResult = async (clickResult: ClickResult) => {
	if (clickResult.type === ClickResultType.REVEAL) {
		Sender.revealTile(clickResult.x, clickResult.y, clickResult.isChord);
	} else {
		Sender.flagTile(
			clickResult.x,
			clickResult.y,
			clickResult.isAdd,
			clickResult.isPencil,
		);
	}
};

export const GameScreen = () => {
	const game = useGlobalState(state => state.game)!;
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);
	const players = useGlobalState(state => state.players);

	const [currentTime, setCurrentTime] = React.useState(Date.now());
	const secondsTillStart = Math.ceil((game.startTime - currentTime) / 1000);
	const isCountdownDone = secondsTillStart <= 0;

	const selfPlayer = players.find(({ id }) => id === selfPlayerId)!;
	if (selfPlayer.teamId === undefined) throw Error('spec not impl');

	const teamPlayers = players.filter(
		player => player.teamId === selfPlayer.teamId,
	);

	const playerData = game.playerDatas[selfPlayer.id];
	const teamData = game.teamDatas[selfPlayer.teamId];

	const gameSeconds = Math.floor(
		Math.max(
			0,
			(Math.min(
				teamData.finishTime ?? Number.MAX_SAFE_INTEGER,
				currentTime,
			) -
				game.startTime) /
				1000,
		),
	);

	const teamStateRef = React.useRef<TeamData>(teamData);
	teamStateRef.current = teamData;

	const isAlive = playerData.isAlive;
	const isTeamAlive = teamData.isAlive;
	const canInteract = isCountdownDone && isTeamAlive && isAlive;

	const onClickBoard = React.useCallback(
		(x: number, y: number, button: number) => {
			if (!canInteract) return;

			const state = useGlobalState.getState();
			const { game } = state;
			if (game === undefined) return;
			const teamId = selfPlayer.teamId;
			if (teamId === undefined) return;
			const teamData = game.teamDatas[teamId];
			if (!isShownTeamData(teamData)) return;

			const clickResult = getClickResult(x, y, button, game, teamData);

			if (clickResult === undefined) return;

			sendClickResult(clickResult);

			update(draftState => {
				const { game } = draftState;
				if (game === undefined) return;
				const teamData = game.teamDatas[teamId];
				if (!isShownTeamData(teamData)) return;

				processClickResult(game, teamData, selfPlayer.id, clickResult);
			});
		},
		[canInteract, selfPlayer.teamId, selfPlayer.id],
	);

	React.useEffect(() => {
		const id = setInterval(() => {
			setCurrentTime(Date.now());
		}, 1000 / 30);

		return () => {
			clearInterval(id);
		};
	}, []);

	return (
		<div>
			<div>
				{isCountdownDone ? null : (
					<div>
						<span>{secondsTillStart}</span>
					</div>
				)}
				{teamData.board === undefined ? (
					<div>?</div>
				) : (
					<div>
						<div>
							<div>
								{teamPlayers.map(({ color, id, name }) => (
									<PlayerDisplay
										color={color}
										isAlive={game.playerDatas[id].isAlive}
										isSelf={id === selfPlayerId}
										name={name}
										key={id}
									/>
								))}
							</div>
							<div>{isTeamAlive ? '😄' : '💀'}</div>
							<div>{gameSeconds}</div>
						</div>
						<BoardComponent
							gameSettings={game.settings}
							teamData={teamData}
							startingPosition={game.startingPosition}
							showMines={!isTeamAlive}
							players={players}
							onClick={onClickBoard}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
