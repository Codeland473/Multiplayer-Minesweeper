import { style } from '@vanilla-extract/css';

export namespace BoardStyle {
	export const tileBack = style({
		fill: '#333',
	});

	export const tileLight = style({
		fill: '#5b5b5b',
	});

	export const tileDark = style({
		fill: '#161616',
	});

	export const flagPole = style({
		fill: '#000',
	});

	export const mineBody = style({
		fill: '#000',
	});

	export const mineLine = style({
		fill: 'none',
		stroke: '#000',
		strokeMiterlimit: 10,
	});

	export const baseNumber = style({
		dominantBaseline: 'central',
		textAnchor: 'middle',
		fontSize: 12,
	});
}
