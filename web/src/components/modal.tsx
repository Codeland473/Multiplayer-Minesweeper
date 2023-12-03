import React from 'react';
import { ModalStyle } from './Modal.css.js';

export type ModalProps = {
	open?: boolean;
	children?: React.ReactNode;
};

export const Modal = ({ open, children }: ModalProps) => {
	return (
		<div className={ModalStyle.dimmer[open ?? true ? 'shown' : 'hidden']}>
			<div className={ModalStyle.container}>{children}</div>
		</div>
	);
};
