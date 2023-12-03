import { globalStyle, style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace PageStyle {
	globalStyle('body', {
		margin: 0,
	});

	export const pageContainer = style({
		width: '100vw',
		height: '100vh',
		boxSizing: 'border-box',
		position: 'relative',
		display: 'flex',
		justifyContent: 'center',
		padding: '1rem',
		fontFamily: 'sans-serif',
		backgroundColor: colors.jet,
	});

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
}
