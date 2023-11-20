import { globalStyle, style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace PageStyle {
	globalStyle('body', {
		margin: 0,
	});

	export const pageContainer = style({
		width: '100%',
		height: '100%',
		position: 'relative',
		display: 'flex',
		justifyContent: 'center',
		padding: '1rem',
		fontFamily: 'sans-serif',
		backgroundColor: colors.jet,
	});
}
