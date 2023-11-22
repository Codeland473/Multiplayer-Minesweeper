import React from 'react';
import { useGlobalState } from './globalState.js';
import { IntroScreen } from './screens/introScreen.js';
import { ConnectScreen } from './screens/connectScreen.js';
import { LobbyScreen } from './screens/lobbyScreen.js';

export const App = () => {
	const connectionState = useGlobalState(state => state.connectionState);
	const selfPlayerId = useGlobalState(state => state.selfPlayerId);

	if (connectionState.status === 'connected') {
		if (selfPlayerId === undefined) {
			return <IntroScreen />;
		} else {
			return <LobbyScreen />;
		}
	} else {
		return <ConnectScreen connectionState={connectionState} />;
	}
};
