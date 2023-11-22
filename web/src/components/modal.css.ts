import { style, styleVariants } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace ModalStyle {
	const baseDimmer = style({
		width: '100vw',
		height: '100vh',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0,0,0,0.25)',
	});

	export const dimmer = styleVariants({
		hidden: [{ display: 'none' }],
		shown: [baseDimmer],
	});

	export const container = style({
		width: 'auto',
		height: 'auto',
		borderRadius: '1.5rem',
		padding: '1.5rem',
		display: 'flex',
		boxSizing: 'border-box',
		backgroundColor: colors.jet,
	});
}
