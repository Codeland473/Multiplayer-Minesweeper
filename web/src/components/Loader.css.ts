import { keyframes, style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace LoaderStyle {
	const outerFrames = keyframes({
		from: {
			strokeDashoffset: 0,
		},
		to: {
			strokeDashoffset: 12.5663706144,
		},
	});

	const innerFrames = keyframes({
		from: {
			strokeDashoffset: 0,
		},
		to: {
			strokeDashoffset: 25.1327412288,
		},
	});

	const line = style({
		strokeDasharray: 6.28318530718,
		strokeDashoffset: 0,
		fill: 'transparent',
		strokeLinecap: 'round',
		strokeWidth: 1,
	});

	export const outerLine = style([
		line,
		{
			stroke: colors.indigo,
			animation: `${outerFrames} 2.0s ease-in-out normal infinite`,
		},
	]);

	export const innerLine = style([
		line,
		{
			stroke: colors.caribbean,
			animation: `${innerFrames} 2.0s ease-in-out normal infinite`,
		},
	]);
}
