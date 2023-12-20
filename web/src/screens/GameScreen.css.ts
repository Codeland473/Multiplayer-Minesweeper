import { style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export const game = style({
	fontFamily: 'sans-serif',
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	boxSizing: 'border-box',
	border: `2px solid ${colors.platinum}`,
	rowGap: '2px',
	backgroundColor: colors.platinum,
	overflow: 'hidden',
});

export const topBar = style({
	height: 'auto',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	width: '100%',
	padding: '1rem',
	backgroundColor: colors.jet,
	boxSizing: 'border-box',
});

export const numberHolder = style({
	display: 'flex',
	boxSizing: 'border-box',
	border: `2px solid ${colors.platinum}`,
	padding: '1rem',
	justifyContent: 'center',
	alignItems: 'center',
	color: 'red',
	fontFamily: 'monospace',
});

export const playerHolder = style({
	display: 'flex',
	flexDirection: 'row',
	columnGap: '0.5rem',
});

export const boardHolder = style({
	position: 'relative',
	padding: '1rem',
	width: '100%',
	height: '100%',
	display: 'flex',
	backgroundColor: colors.jet,
	boxSizing: 'border-box',
	overflow: 'hidden',
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

/* --------------------------------------------- */

export const mainView = style({
	width: '100vw',
	height: '100vh',
	position: 'absolute',
	left: '0',
	top: '0',

	padding: '1rem',
	display: 'grid',
	rowGap: '1rem',
	gridTemplateRows: '1fr 10rem',
	backgroundColor: colors.jet,
	boxSizing: 'border-box',
});

export const lowerScroller = style({
	padding: '1rem',
	height: '100%',
	overflowY: 'scroll',
	display: 'flex',
	flexDirection: 'column',
	boxSizing: 'border-box',
	border: `2px solid ${colors.platinum}`,
});
