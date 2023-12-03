import { style, styleVariants } from '@vanilla-extract/css';

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

	export const number = styleVariants({
		1: [baseNumber, { color: '#395fd8' }],
		2: [baseNumber, { color: '#39c1ea' }],
		3: [baseNumber, { color: '#54ea24' }],
		4: [baseNumber, { color: '#e8e32e' }],
		5: [baseNumber, { color: '#ea8521' }],
		6: [baseNumber, { color: '#ef2222' }],
		7: [baseNumber, { color: '#d83f72' }],
		8: [baseNumber, { color: '#af51e0' }],
	});

	export const startingLine = style({
		fill: 'none',
		stroke: '#08bc62',
		strokeLinecap: 'round',
		strokeMiterlimit: 10,
		strokeWidth: '2px',
	});
}
