import React from 'react';
import { LoaderStyle } from './loader.css.js';

export type LoaderProps = {
	className?: string;
};

export const Loader = ({ className }: LoaderProps) => {
	return (
		<svg viewBox="0.5 0.5 9 9" className={className}>
			<path
				d="M 1 5 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0"
				className={LoaderStyle.outerLine}
			/>
			<path
				d="M 3 5 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0"
				className={LoaderStyle.innerLine}
			/>
		</svg>
	);
};
