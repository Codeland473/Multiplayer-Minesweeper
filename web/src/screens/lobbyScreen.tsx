import React from 'react';
import { PageStyle } from './page.css.js';
import { Color, Player, useGlobalState } from '../globalState.js';
import { LobbyScreenStyle } from './lobbyScreen.css.js';
import { Icon } from '../components/icon.js';
import { groupBy } from '../util.js';

export const BarPlayer = ({
	color,
	name,
	isSelf,
}: {
	color: Color;
	name: string;
	isSelf: boolean;
}) => {
	return (
		<div>
			<div>
				<Icon name="person" weight={isSelf ? 'fill' : 'outline'} />
				<div />
			</div>
			<span>{name}</span>
		</div>
	);
};

export const TeamBox = ({
	players,
	selfPlayerId,
	name,
}: {
	players: Player[];
	selfPlayerId: number;
	name: string;
}) => {
	const isSelfTeam = players.some(({ id }) => id === selfPlayerId);

	return (
		<div>
			<div></div>
			<div>
				<span>{name}</span>
				{isSelfTeam ? (
					<>
						<Icon name="edit" />
						<Icon name="logout" />
					</>
				) : null}
			</div>
		</div>
	);
};

export const LobbyScreen = () => {
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);
	const players = useGlobalState(state => state.players);
	const teams = useGlobalState(state => state.teams);

	const selfPlayer = players.find(({ id }) => id === selfPlayerId)!;
	const selfTeam = teams.find(({ id }) => id === selfPlayer.teamId);

	const playersByTeam = groupBy(players, ({ teamId }) => teamId ?? 0);

	return (
		<div className={PageStyle.pageContainer}>
			<div className={PageStyle.content}>
				<div className={LobbyScreenStyle.lobbyBar}></div>
				<button disabled={selfTeam === undefined}>Start</button>
			</div>
		</div>
	);
};
