import React from 'react';
import { TeamData, update, useGlobalState } from '../global-state.js';
import { BoardComponent } from '../components/BoardComponent.js';
import { handleClickTile, isShownTeamData } from '../tiles.js';
import { Icon } from '../components/Icon.js';
import { rgbToHex } from '../util.js';
import { PlayerDisplay } from '../components/PlayerDisplay.js';

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
		(Math.min(teamData.finishTime ?? Number.MAX_SAFE_INTEGER, currentTime) -
			game.startTime) /
			1000,
	);

	const teamStateRef = React.useRef<TeamData>(teamData);
	teamStateRef.current = teamData;

	const isAlive = playerData.isAlive;
	const isTeamAlive = teamData.isAlive;
	const canInteract = isCountdownDone && isTeamAlive && isAlive;

	const onClickBoard = React.useCallback(
		(x: number, y: number, button: number) => {
			if (!canInteract) return;
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
		[canInteract, selfPlayer.id, selfPlayer.teamId],
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
				{teamData.revealed === undefined ||
				teamData.flags === undefined ? (
					<div>?</div>
				) : (
					<div>
						<div>
							<div>
								{teamPlayers.map(({ color, id, name }) => (
									<PlayerDisplay
										color={color}
										isAlive={game.playerDatas[id]}
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
							board={game.board}
							flags={teamData.flags}
							revealed={teamData.revealed}
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
