import React from 'react';

export type ModalProps = {
	open: boolean;
	children?: React.ReactNode;
};

export const Modal = ({ open, children }: ModalProps) => {
	return (
		<div>
			<div>{children}</div>
		</div>
	);
};
