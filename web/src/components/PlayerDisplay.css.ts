import { style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace PlayerStyle {
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
}
