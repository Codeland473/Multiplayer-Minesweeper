import { style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export const page = style({});

export const game = style({
	fontFamily: 'sans-serif',

	display: 'flex',
	flexDirection: 'column',
});

export const topBar = style({
	height: 'auto',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	width: '100%',
});

export const boardHolder = style({
	position: 'relative',
});

export const dimmer = style({
	position: 'absolute',
	left: 0,
	top: 0,
	width: '100%',
	height: '100%',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: 'rgba(0,0,0,0.5)',
	color: colors.white,
	fontSize: '2rem',
});
