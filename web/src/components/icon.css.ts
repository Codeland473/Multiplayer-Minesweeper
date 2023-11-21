import { fontFace, style, styleVariants } from '@vanilla-extract/css';
import materialSymbolsWoff2 from '../assets/material-symbols.woff2';

export namespace IconStyle {
	export const materialSymbols = fontFace({
		src: `url(${materialSymbolsWoff2}) format('woff2')`,
		fontStyle: 'normal',
	});

	const baseIcon = style({
		/* google defaults */
		fontFamily: materialSymbols,
		fontWeight: 'normal',
		fontStyle: 'normal',
		display: 'inline-block',
		lineHeight: 1,
		textTransform: 'none',
		letterSpacing: 'normal',
		wordWrap: 'normal',
		whiteSpace: 'nowrap',
		direction: 'ltr',
	});

	export const icon = styleVariants({
		outline: [
			baseIcon,
			{
				fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0",
			},
		],
		fill: [
			baseIcon,
			{
				fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0",
			},
		],
	});
}
