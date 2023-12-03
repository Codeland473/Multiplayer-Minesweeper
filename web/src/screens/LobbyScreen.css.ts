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

	/* team holder */

	export const teamBox = style({
		display: 'flex',
		flexDirection: 'column',
		rowGap: '0.5rem',
	});

	const baseTeamBoxOutline = style({
		display: 'flex',
		flexDirection: 'row',
		padding: '1rem',
		outline: `0.25rem solid ${colors.caribbean}`,
		borderRadius: '1rem',
		height: 'auto',
		columnGap: '1rem',
		justifyContent: 'center',
	});

	export const teamBoxOutline = styleVariants({
		empty: [baseTeamBoxOutline, { outline: 'none' }],
		normal: [baseTeamBoxOutline],
		selfTeam: [baseTeamBoxOutline, { outlineWidth: '0.5rem' }],
	});

	export const teamNameArea = style({
		display: 'flex',
		flexDirection: 'row',
		columnGap: '0.5rem',
		color: colors.white,
		justifyContent: 'center',
		height: '1.5rem',
		alignItems: 'center',
	});

	export const teamName = style({
		fontSize: '1rem',
		lineHeight: '1.25rem',
	});

	export const teamButton = style({
		cursor: 'pointer',
		fontSize: '1rem',
	});
}
