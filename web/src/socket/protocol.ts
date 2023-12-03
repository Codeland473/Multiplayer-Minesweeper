export enum SettingCode {
	IS_NO_GUESSING = 1,
	IS_SUDDEN_DEATH = 2,
	BOARD_SIZE = 3,
	MINE_COUNT = 4,
	COUNTDOWN_LENGTH = 5,
}

export enum SendCode {
	TEAM_CREATE = 1,
	TEAM_REMOVE = 2,
	SELF_NAME_UPDATE = 3,
	SELF_COLOR_UPDATE = 4,
	SELF_TEAM_UPDATE = 5,
	SETTINGS_UPDATE = 6,
	GAME_START = 7,
	SQUARE_REVEAL = 8,
	SQUARE_FLAG = 9,
	CURSOR_UPDATE = 10,
	TEAM_NAME_UPDATE = 11,

	SELF_JOIN = 50,
	RECOVER = 51,
}

export enum ReceiveCode {
	TEAM_CREATE = 1,
	TEAM_REMOVE = 2,
	PLAYER_NAME_UPDATE = 3,
	PLAYER_COLOR_UPDATE = 4,
	PLAYER_TEAM_UPDATE = 5,
	SETTINGS_UPDATE = 6,
	GAME_START = 7,
	TILE_REVEAL = 8,
	TILE_FLAG = 9,
	CURSOR_UPDATE = 10,
	TEAM_NAME_UPDATE = 11,
	BOARD_CLEAR = 12,

	LOBBY_STATE = 50,
	PLAYER_CREATE = 51,
	PLAYER_REMOVE = 52,
	TEAM_FINISH = 53,
	PLAYER_LOSE = 54,
	TEAM_LOSE = 55,
}
