import { style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace ConnectScreenStyle {
	export const content = style({
		width: '100%',
		height: '100%',
		maxWidth: '60rem',
		justifyContent: 'center',
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',
		rowGap: '0.5rem',
	});

	export const title = style({
		fontSize: '1.5rem',
		fontWeight: 'bold',
		lineHeight: '2.0rem',
		color: colors.white,
		textAlign: 'center',
	});

	export const line = style({
		fontSize: '1.0rem',
		lineHeight: '1.25rem',
		textAlign: 'center',
		color: colors.white,
	});

	export const highlight = style({
		color: colors.caribbean,
	});

	export const loader = style({
		width: '6rem',
		height: '6rem',
	});
}
