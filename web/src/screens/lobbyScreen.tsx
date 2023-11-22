import React from 'react';
import { PageStyle } from './page.css.js';
import { Color, Player, Team, useGlobalState } from '../globalState.js';
import { LobbyScreenStyle } from './lobbyScreen.css.js';
import { Icon } from '../components/icon.js';
import { groupBy, rgbToHex } from '../util.js';
import { Updater, useImmer } from 'use-immer';
import { Modal } from '../components/modal.js';
import { Protocol } from '../socket/protocol.js';

export const BarPlayer = ({
	color,
	name,
	isSelf,
}: {
	color: Color;
	name: string;
	isSelf: boolean;
}) => {
	const style = React.useMemo<React.CSSProperties>(
		() => ({ color: rgbToHex(color[0], color[1], color[2]) }),
		[color],
	);

	return (
		<div className={LobbyScreenStyle.playerHolder}>
			<div className={LobbyScreenStyle.playerIconHolder}>
				<Icon
					className={LobbyScreenStyle.playerIcon}
					style={style}
					name="person"
					weight={isSelf ? 'fill' : 'outline'}
				/>
				<div className={LobbyScreenStyle.playerShowcase} />
			</div>
			<span className={LobbyScreenStyle.playerName}>{name}</span>
		</div>
	);
};

export const TeamBox = ({
	team,
	isSelfTeam,
	children,
	onOpenEdit,
	onExit,
}: {
	team: Team;
	isSelfTeam: boolean;
	children: React.ReactNode;
	onOpenEdit: (team: Team) => void;
	onExit: () => void;
}) => {
	const boundOpenEdit = React.useCallback(() => {
		onOpenEdit(team);
	}, [onOpenEdit, team]);

	return (
		<div>
			<div>{children}</div>
			<div>
				<span>{team.name}</span>
				{isSelfTeam ? (
					<>
						<Icon name="edit" onClick={boundOpenEdit} />
						<Icon name="logout" onClick={onExit} />
					</>
				) : null}
			</div>
		</div>
	);
};

type TeamEditState =
	| {
			teamId: undefined;
			oldName: undefined;
			inputName: string;
	  }
	| {
			teamId: number;
			oldName: string;
			inputName: string;
	  };

export const TeamNameModal = ({
	teamEditState,
	setTeamEditState,
	onClose,
	onSave,
}: {
	teamEditState: TeamEditState;
	setTeamEditState: Updater<TeamEditState | undefined>;
	onClose: () => void;
	onSave: (teamId: number | undefined, newName: string) => void;
}) => {
	const isEditing = teamEditState.oldName !== undefined;

	const onInputTeamName = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const { value } = event.currentTarget;
			setTeamEditState(state => {
				if (state === undefined) return;
				state.inputName = value;
			});
		},
		[setTeamEditState],
	);

	const realName = teamEditState.inputName.trim();

	const onSaveName = React.useCallback(() => {
		onSave(teamEditState.teamId, realName);
	}, [onSave, realName, teamEditState.teamId]);

	return (
		<Modal>
			<div>
				<span>{isEditing ? 'Edit Team Name' : 'Create New Team'}</span>
				{isEditing ? (
					<span>{`Original team name: ${teamEditState.oldName}`}</span>
				) : null}
				<input
					value={teamEditState.inputName}
					onChange={onInputTeamName}
				/>
				<div>
					<button onClick={onClose}>Cancel</button>
					<button
						onClick={onSaveName}
						disabled={realName.length === 0}
					>
						Save
					</button>
				</div>
			</div>
		</Modal>
	);
};

const groupPlayersByTeam = (
	teams: readonly Team[],
	players: readonly Player[],
) => {
	const teamMap: { [key: number]: Player[] } = {};

	teamMap[0] = [];

	for (const team of teams) {
		teamMap[team.id] = [];
	}

	for (const player of players) {
		teamMap[player.teamId ?? 0].push(player);
	}

	return teamMap;
};

export const LobbyScreen = () => {
	const selfPlayerId = useGlobalState(state => state.selfPlayerId)!;
	const players = useGlobalState(state => state.players);
	const teams = useGlobalState(state => state.teams);

	const selfPlayer = players.find(({ id }) => id === selfPlayerId)!;
	const selfTeam = teams.find(({ id }) => id === selfPlayer.teamId);

	const playersByTeam = groupPlayersByTeam(teams, players);
	const sortedTeamKeys = Object.keys(playersByTeam)
		.map(key => Number.parseInt(key))
		.sort((left, right) =>
			left === 0
				? 1
				: right === 0
				? -1
				: left === selfTeam?.id
				? -1
				: right === selfTeam?.id
				? 1
				: right - left,
		);

	const [teamEditState, setTeamEditState] = useImmer<
		TeamEditState | undefined
	>(undefined);

	const onCloseTeamModal = React.useCallback(() => {
		setTeamEditState(undefined);
	}, [setTeamEditState]);

	const onSaveTeamModal = React.useCallback(
		(teamId: number | undefined, newName: string) => {
			if (teamId === undefined) {
				Protocol.teamCreate(newName);
			} else {
				Protocol.teamNameUpdate(teamId, newName);
			}

			setTeamEditState(undefined);
		},
		[setTeamEditState],
	);

	const onOpenTeamEdit = React.useCallback(
		(team: Team) => {
			setTeamEditState({
				inputName: team.name,
				oldName: team.name,
				teamId: team.id,
			});
		},
		[setTeamEditState],
	);

	const onOpenNewTeam = React.useCallback(() => {
		setTeamEditState({
			inputName: '',
			oldName: undefined,
			teamId: undefined,
		});
	}, [setTeamEditState]);

	const onLeaveTeam = React.useCallback(() => {
		Protocol.moveTeams(undefined);
	}, []);

	return (
		<div className={PageStyle.pageContainer}>
			{teamEditState === undefined ? null : (
				<TeamNameModal
					onClose={onCloseTeamModal}
					onSave={onSaveTeamModal}
					setTeamEditState={setTeamEditState}
					teamEditState={teamEditState}
				/>
			)}

			<div className={PageStyle.content}>
				<div className={LobbyScreenStyle.lobbyBar}>
					{sortedTeamKeys.map(teamId => {
						const team = teams.find(({ id }) => id === teamId);
						const players = playersByTeam[teamId];

						const barPlayers = players.map(player => (
							<BarPlayer
								key={player.id}
								color={player.color}
								name={player.name}
								isSelf={player.id === selfPlayerId}
							/>
						));

						if (team === undefined) {
							return barPlayers;
						} else {
							return (
								<TeamBox
									key={teamId}
									team={team}
									isSelfTeam={selfPlayer.teamId === team.id}
									onExit={onLeaveTeam}
									onOpenEdit={onOpenTeamEdit}
								>
									{barPlayers}
								</TeamBox>
							);
						}
					})}
					{selfTeam === undefined ? (
						<button onClick={onOpenNewTeam}>
							<Icon name="add" />
						</button>
					) : null}
				</div>
				<button disabled={selfTeam === undefined}>Start</button>
			</div>
		</div>
	);
};
