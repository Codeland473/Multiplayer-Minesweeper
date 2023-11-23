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

	export const playerHolder = style({
		display: 'flex',
		flexDirection: 'column',
		height: 'auto',
		rowGap: '0.5rem',
		alignItems: 'center',
	});

	export const playerIconHolder = style({
		display: 'flex',
		padding: '0.5rem',
		justifyContent: 'center',
		alignItems: 'center',
		height: '2rem',
		width: '2rem',
		position: 'relative',
	});

	export const playerIcon = style({
		fontSize: '2.5rem',
	});

	export const playerShowcase = style({
		position: 'absolute',
		bottom: 0,
		left: 0,
		width: '100%',
		height: '100%',
		borderRadius: '0.25rem',
		borderBottom: `1px solid ${colors.platinum}`,
		boxSizing: 'border-box',
	});

	export const playerName = style({
		color: colors.white,
		fontSize: '1rem',
		lineHeight: '1.25rem',
		height: '1.5rem',
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
