import React from 'react';
import {
	GameSettings,
	StartingPosition,
	TeamData,
	update,
	useGlobalState,
} from '../global-state.js';
import { BoardComponent } from '../components/BoardComponent.js';
import {
	ClickResult,
	ClickResultType,
	getClickResult,
	getMineCount,
	isShownTeamData,
	processClickResult,
} from '../tiles.js';
import { PlayerDisplay } from '../components/PlayerDisplay.js';
import { Sender } from '../socket/sender.js';
import * as style from './GameScreen.css.js';
import { Icon } from '../components/Icon.js';

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

const threeDigitNumber = (number: number): string => {
	if (number >= 1000) return '999';
	if (number >= 100) return number.toString();
	if (number >= 10) return '0' + number.toString();
	if (number >= 0) return '00' + number.toString();
	if (number >= -9) return '-0' + (-number).toString();
	if (number >= -99) return number.toString();
	return '-99';
};

const Game = ({
	startTime,
	settings,
	teamData,
	startingPosition,
	teamId,
	playerId,
	gameSeconds: inGameSeconds,
}: {
	startTime: number;
	settings: GameSettings;
	teamData: TeamData;
	startingPosition: StartingPosition | undefined;
	teamId: number;
	playerId: number | undefined;
	gameSeconds: number;
}) => {
	const players = useGlobalState(state => state.players);
	const playerDatas = useGlobalState(state => state.game!.playerDatas);

	const teamPlayers = players.filter(player => player.teamId === teamId);

	const teamStateRef = React.useRef<TeamData>(teamData);
	teamStateRef.current = teamData;

	const selfPlayerData =
		playerId === undefined ? undefined : playerDatas[playerId];
	const isSelfAlive = selfPlayerData?.isAlive ?? false;
	const isTeamAlive = teamData.isAlive;

	const finishSeconds =
		teamData.finishTime === undefined
			? undefined
			: calcGameSeconds(startTime, teamData.finishTime);
	const gameSeconds = finishSeconds ?? inGameSeconds;

	const canInteract = gameSeconds >= 0 && isTeamAlive && isSelfAlive;

	const onClickBoard = React.useCallback(
		(x: number, y: number, button: number) => {
			if (
				!canInteract ||
				selfPlayerData === undefined ||
				playerId === undefined
			)
				return;

			const state = useGlobalState.getState();
			const { game } = state;
			if (game === undefined) return;
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

				processClickResult(game, teamData, playerId, clickResult);
			});
		},
		[canInteract, playerId, selfPlayerData, teamId],
	);

	const mineCount = React.useMemo(() => {
		if (!isShownTeamData(teamData)) return undefined;
		return getMineCount(teamData.board, teamData.flags, settings.mineCount);
	}, [settings.mineCount, teamData]);

	const reset = React.useCallback(() => {
		Sender.reset();
	}, []);

	return (
		<div className={style.game}>
			<div className={style.topBar}>
				<div className={style.numberHolder}>
					{mineCount !== undefined
						? threeDigitNumber(mineCount)
						: '???'}
				</div>
				<div className={style.playerHolder}>
					{teamPlayers.map(({ color, id, name, isConnected }) => (
						<PlayerDisplay
							color={color}
							isAlive={playerDatas[id].isAlive}
							isSelf={id === playerId}
							name={name}
							key={id}
							isConnected={isConnected}
						/>
					))}
				</div>
				<div onClick={reset}>
					{isTeamAlive ? <Icon name="mood" /> : <Icon name="skull" />}
				</div>
				<div className={style.numberHolder}>
					{threeDigitNumber(gameSeconds < 0 ? 0 : gameSeconds)}
				</div>
			</div>
			{isShownTeamData(teamData) ? (
				<div className={style.boardHolder}>
					{gameSeconds < 0 ? (
						<div className={style.dimmer}>
							<span>{-gameSeconds}</span>
						</div>
					) : null}
					<BoardComponent
						gameSettings={settings}
						teamData={teamData}
						startingPosition={startingPosition}
						showMines={!isTeamAlive}
						players={players}
						onClick={onClickBoard}
					/>
				</div>
			) : null}
		</div>
	);
};

const calcGameSeconds = (baseTime: number, now: number) => {
	return Math.floor((now - baseTime) / 1000);
};

export const GameScreen = () => {
	const game = useGlobalState(state => state.game)!;
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);
	const players = useGlobalState(state => state.players);

	const selfTeamId = players.find(({ id }) => id === selfPlayerId)?.teamId;

	const [gameSeconds, setGameSeconds] = React.useState(
		calcGameSeconds(game.startTime, Date.now()),
	);

	React.useEffect(() => {
		const baseTime = game.startTime;

		const id = setInterval(() => {
			setGameSeconds(calcGameSeconds(baseTime, Date.now()));
		}, 1000 / 60);

		return () => {
			clearInterval(id);
		};
	}, [game.startTime]);

	const selfTeamData = Object.entries(game.teamDatas).find(
		([teamId]) => +teamId === selfTeamId,
	);
	const otherTeamDatas = Object.entries(game.teamDatas).filter(
		([teamId]) => +teamId !== selfTeamId,
	);

	if (selfTeamData === undefined) throw Error('spec not impl');

	return (
		<div className={style.mainView}>
			<Game
				gameSeconds={gameSeconds}
				playerId={selfPlayerId}
				settings={game.settings}
				startTime={game.startTime}
				startingPosition={game.startingPosition}
				teamData={selfTeamData[1]}
				teamId={+selfTeamData[0]}
			/>
			<div className={style.lowerScroller}>
				{otherTeamDatas.map(([teamId, teamData]) => (
					<Game
						key={teamId}
						gameSeconds={gameSeconds}
						playerId={selfPlayerId}
						settings={game.settings}
						startTime={game.startTime}
						startingPosition={game.startingPosition}
						teamData={teamData}
						teamId={+teamId}
					/>
				))}
			</div>
		</div>
	);
};
