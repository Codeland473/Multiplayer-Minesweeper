import React from 'react';
import { ConnectionState } from '../globalState.js';
import { Socket } from '../socket/socket.js';
import { Loader } from '../components/loader.js';
import { PageStyle } from './page.css.js';
import { ConnectScreenStyle } from './connectScreen.css.js';

export type ConnectScreenProps = {
	connectionState: ConnectionState;
};

export const ConnectScreen = ({ connectionState }: ConnectScreenProps) => {
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
