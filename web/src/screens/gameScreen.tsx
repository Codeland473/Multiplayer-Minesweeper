import { useGlobalState } from '../globalState.js';

export const GameScreen = () => {
	const game = useGlobalState(state => state.game)!;
};
