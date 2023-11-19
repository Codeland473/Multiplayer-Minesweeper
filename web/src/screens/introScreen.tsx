import React from 'react';
import { useImmer } from 'use-immer';
import { randIntRange, rgbToHex } from '../util.js';

type PlayerSetup = {
	red: number;
	green: number;
	blue: number;
	name: string;
};

const defaultPlayerSetup = (): PlayerSetup => {
	return {
		red: randIntRange(0, 255),
		green: randIntRange(0, 255),
		blue: randIntRange(0, 255),
		name: '',
	};
};

export const IntroScreen = () => {
	const [{ blue, green, name, red }, setPlayerSetup] = useImmer(() =>
		defaultPlayerSetup(),
	);

	const realName = name.trim();

	const join = React.useCallback(() => {}, []);

	return (
		<div>
			<div>
				<span>Multiplayer Minesweeper</span>
				<span>Create your player</span>
				<div>
					<span>
						<span>Color: </span>
						<span>{rgbToHex(red, green, blue)}</span>
					</span>
					<input type="color" />
				</div>
				<input value={name} placeholder="Your name" autoFocus />
				<button disabled={realName.length === 0} onClick={join}>
					Join!
				</button>
			</div>
		</div>
	);
};
