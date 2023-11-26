import React from 'react';
import { useGlobalState } from './globalState.js';
import { IntroScreen } from './screens/introScreen.js';
import { ConnectScreen } from './screens/connectScreen.js';
import { LobbyScreen } from './screens/lobbyScreen.js';
import { GameScreen } from './screens/gameScreen.js';

export const App = () => {
	const connectionState = useGlobalState(state => state.connectionState);
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);
	const game = useGlobalState(state => state.game);

	if (connectionState.status === 'connected') {
		if (selfPlayerId === undefined) {
			if (game === undefined) {
				return <IntroScreen />;
			} else {
				return <GameScreen />;
			}
		} else {
			return <LobbyScreen />;
		}
	} else {
		return <ConnectScreen />;
	}
};
