import { style, styleVariants } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace LobbyStyle {
	export const lobbyBar = style({
		width: '100%',
		height: 'auto',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		columnGap: '1rem',
	});

	/* player */

	export const playerHolder = style({});

	export const playerIconHolder = style({});

	export const playerIcon = style({});

	export const playerShowcase = style({});

	export const playerName = style({});

	/* team holder */

	export const teamBox = style({
		display: 'flex',
		flexDirection: 'column',
	});

	const baseTeamBoxOutline = style({
		display: 'flex',
		flexDirection: 'row',
		padding: '1rem',
		border: `0.25rem solid ${colors.caribbean}`,
		borderRadius: '1rem',
		height: 'auto',
		columnGap: '1rem',
	});

	export const teamBoxOutline = styleVariants({
		normal: [baseTeamBoxOutline],
		selfTeam: [baseTeamBoxOutline, { borderWidth: '0.5rem ' }],
	});

	export const teamNameArea = style({});

	export const teamName = style({});
	export const teamButton = style({});
}
