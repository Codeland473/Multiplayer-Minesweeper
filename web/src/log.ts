import { Color } from './global-state.js';

export namespace Log {
	export enum Type {
		TEAM_NAME_UPDATE,
		TEAM_REMOVE,
	}

	export type BaseItem = {
		type: Type;
	};

	export type TeamNameUpdate = BaseItem & {
		type: Type.TEAM_NAME_UPDATE;
		byPlayerId: number;
		teamId: number;
		oldName: string;
		newName: string;
	};

	export type TeamRemove = BaseItem & {
		type: Type.TEAM_REMOVE;
		byPlayerId: number;
		teamId: number;
		teamName: string;
	};

	export type Item = TeamNameUpdate | TeamRemove;
}
