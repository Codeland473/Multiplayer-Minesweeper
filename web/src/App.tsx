import React from 'react';
import { useGlobalState } from './globalState.js';
import { IntroScreen } from './screens/introScreen.js';
import { ConnectScreen } from './screens/connectScreen.js';

export const App = () => {
	const connectionState = useGlobalState(state => state.connectionState);

	if (connectionState.status === 'connected') {
		return <IntroScreen />;
	} else {
		return <ConnectScreen connectionState={connectionState} />;
	}
};
