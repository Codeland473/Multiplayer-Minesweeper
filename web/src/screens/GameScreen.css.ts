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
	flexDirection: 'row',
	justifyContent: 'space-between',
});

export const boardHolder = style({});

export const dimmer = style({
	width: '100%',
	height: '100%',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: 'rgba(0,0,0,0.5)',
	color: colors.white,
	fontSize: '2rem',
});
