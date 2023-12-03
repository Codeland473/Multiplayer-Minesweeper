import React from 'react';
import { useGlobalState } from './global-state.js';
import { IntroScreen } from './screens/IntroScreen.js';
import { ConnectScreen } from './screens/ConnectScreen.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { GameScreen } from './screens/GameScreen.js';

export const App = () => {
	const connectionState = useGlobalState(state => state.connectionState);
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);
	const game = useGlobalState(state => state.game);

	if (connectionState.status === 'connected') {
		if (selfPlayerId !== undefined) {
			if (game !== undefined) {
				return <GameScreen />;
			} else {
				return <LobbyScreen />;
			}
		} else {
			return <IntroScreen />;
		}
	} else {
		return <ConnectScreen />;
	}
};
