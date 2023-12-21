import React from 'react';
import { Color } from '../global-state.js';
import { AllOrNothing, rgbToHex } from '../util.js';
import { PlayerStyle } from './PlayerDisplay.css.js';
import { Icon } from './Icon.js';

export type PlayerDisplayProps = AllOrNothing<{
	color: Color;
	name: string;
	isSelf: boolean;
	isAlive: boolean;
	isConnected: boolean;
	onClick?: () => void;
}>;

export const PlayerDisplay = ({
	color,
	name,
	isSelf,
	isAlive,
	isConnected,
	onClick,
}: PlayerDisplayProps) => {
	const style = React.useMemo<React.CSSProperties>(
		() =>
			color === undefined
				? {}
				: { color: rgbToHex(color[0], color[1], color[2]) },
		[color],
	);

	return (
		<div className={PlayerStyle.playerHolder}>
			<div className={PlayerStyle.playerIconHolder}>
				{color === undefined ? null : (
					<Icon
						className={PlayerStyle.playerIcon}
						style={style}
						name={
							isConnected
								? 'wifi_off'
								: isAlive
								? 'person'
								: 'skull'
						}
						weight={isSelf ? 'fill' : 'outline'}
					/>
				)}
				<div className={PlayerStyle.playerShowcase} onClick={onClick} />
			</div>
			<span className={PlayerStyle.playerName}>{name}</span>
		</div>
	);
};
