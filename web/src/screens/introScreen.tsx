import React from 'react';
import { useImmer } from 'use-immer';
import { hexToRgb, randIntRange, rgbToHex } from '../util.js';
import { PageStyle } from './page.css.js';
import { IntroScreenStyle } from './introScreen.css.js';
import { Protocol } from '../socket/protocol.js';

type PlayerSetup = {
	red: number;
	green: number;
	blue: number;
	inputName: string;
};

const defaultPlayerSetup = (): PlayerSetup => {
	return {
		red: randIntRange(0, 255),
		green: randIntRange(0, 255),
		blue: randIntRange(0, 255),
		inputName: '',
	};
};

export const IntroScreen = () => {
	const [{ blue, green, inputName, red }, setPlayerSetup] = useImmer(() =>
		defaultPlayerSetup(),
	);

	const realName = inputName.trim();

	const join = React.useCallback(() => {
		Protocol.join(undefined, undefined, [red, green, blue], realName);
	}, [blue, green, realName, red]);

	const hexColor = rgbToHex(red, green, blue);
	const onChangeColor = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const [red, green, blue] = hexToRgb(event.currentTarget.value);
			setPlayerSetup(state => {
				state.red = red;
				state.green = green;
				state.blue = blue;
			});
		},
		[setPlayerSetup],
	);

	const colorInputRef = React.useRef<HTMLInputElement>(null);
	const colorInput = (
		<input
			ref={colorInputRef}
			className={IntroScreenStyle.hidden}
			type="color"
			value={hexColor}
			onChange={onChangeColor}
		/>
	);

	const onClickColor = React.useCallback(() => {
		colorInputRef.current?.click();
	}, []);

	const onInputName = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = event.currentTarget.value;
			setPlayerSetup(state => {
				state.inputName = value;
			});
		},
		[setPlayerSetup],
	);

	return (
		<div className={PageStyle.pageContainer}>
			<div className={PageStyle.content}>
				{colorInput}
				<span className={PageStyle.title}>Multiplayer Minesweeper</span>
				<span className={PageStyle.line}>Create your player</span>

				<div onClick={onClickColor}>
					<span className={PageStyle.line}>
						<span>Color: </span>
						<span style={{ color: hexColor }}>{hexColor}</span>
					</span>
				</div>

				<input
					value={inputName}
					placeholder="Your name"
					autoFocus
					onChange={onInputName}
				/>
				<button disabled={realName.length === 0} onClick={join}>
					Join!
				</button>
			</div>
		</div>
	);
};
