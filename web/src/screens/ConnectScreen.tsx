import React from 'react';
import { Socket } from '../socket/socket.js';
import { Loader } from '../components/Loader.js';
import { PageStyle } from './Page.css.js';
import { ConnectScreenStyle } from './ConnectScreen.css.js';
import { useGlobalState } from '../global-state.js';

export const ConnectScreen = () => {
	const connectionState = useGlobalState(state => state.connectionState);

	const isLoading = connectionState.status === 'loading';
	const { error } = connectionState;

	const connectNow = React.useCallback(() => {
		Socket.newSocket();
	}, []);

	return (
		<div className={PageStyle.pageContainer}>
			{isLoading ? (
				<div className={PageStyle.content}>
					<span className={PageStyle.title}>Connecting...</span>
					<Loader className={ConnectScreenStyle.loader} />
				</div>
			) : (
				<div className={PageStyle.content}>
					<span className={PageStyle.title}>Error</span>
					<span className={PageStyle.line}>
						Could not connect to server. Please check your network
						connection.
					</span>
					<span className={PageStyle.line}>
						{error === undefined ? (
							'...'
						) : (
							<>
								{'Retrying to connect in '}
								<span className={ConnectScreenStyle.highlight}>
									{error.timeout}
								</span>
								.
							</>
						)}
					</span>
					<button onClick={connectNow}>Connect Now</button>
				</div>
			)}
		</div>
	);
};
