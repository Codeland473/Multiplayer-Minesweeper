import { style } from '@vanilla-extract/css';
import { colors } from '../colors.js';

export namespace ConnectScreenStyle {
	export const loader = style({
		width: '6rem',
		height: '6rem',
	});

	export const highlight = style({
		color: colors.caribbean,
	});
}
