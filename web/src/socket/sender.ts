import { Color, GameSettings } from '../globalState.js';
import { Data } from './data.js';
import { Socket } from './socket.js';
import { SendCode, SettingCode } from './protocol.js';

export namespace Sender {
	export const teamCreate = Socket.registerSender((teamName: string) => {
		const nameBuffer = Data.textEncoder.encode(teamName);

		const sendBuffer = new Uint8Array(1 + 2 + nameBuffer.length);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.TEAM_CREATE);
		writer.writeString(nameBuffer);

		return sendBuffer;
	});

	export const teamRemove = Socket.registerSender((teamId: number) => {
		const sendBuffer = new Uint8Array(1 + 4);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.TEAM_REMOVE);
		writer.writeInt(teamId);

		return sendBuffer;
	});

	export const selfNameUpdate = Socket.registerSender((name: string) => {
		const nameBuffer = Data.textEncoder.encode(name);

		const sendBuffer = new Uint8Array(1 + 2 + nameBuffer.length);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.SELF_NAME_UPDATE);
		writer.writeString(nameBuffer);

		return sendBuffer;
	});

	export const selfColorUpdate = Socket.registerSender((color: Color) => {
		const sendBuffer = new Uint8Array(1 + 3);
		const writer = Data.createWriter(sendBuffer);

		writer.writeByte(SendCode.SELF_COLOR_UPDATE);
		writer.writeByte(color[0]);
		writer.writeByte(color[1]);
		writer.writeByte(color[2]);

		return sendBuffer;
	});

	export const moveTeams = Socket.registerSender(
		(teamId: number | undefined) => {
			const sendBuffer = new Uint8Array(1 + 4);
			const writer = Data.createWriter(sendBuffer);

			writer.writeByte(SendCode.SELF_TEAM_UPDATE);
			writer.writeInt(teamId ?? 0);

			return sendBuffer;
		},
	);

	export const settingUpdate = Socket.registerSender(
		(setSetting: Partial<GameSettings>) => {
			if (
				setSetting.boardHeight !== undefined &&
				setSetting.boardWidth !== undefined
			) {
				const sendBuffer = new Uint8Array(1 + 4 + 8);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.BOARD_SIZE);
				writer.writeInt(setSetting.boardWidth);
				writer.writeInt(setSetting.boardHeight);

				return sendBuffer;
			} else if (setSetting.isNoGuessing !== undefined) {
				const sendBuffer = new Uint8Array(1 + 4 + 1);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.IS_NO_GUESSING);
				writer.writeBool(setSetting.isNoGuessing);

				return sendBuffer;
			} else if (setSetting.isSuddenDeath !== undefined) {
				const sendBuffer = new Uint8Array(1 + 4 + 1);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.IS_SUDDEN_DEATH);
				writer.writeBool(setSetting.isSuddenDeath);

				return sendBuffer;
			} else if (setSetting.mineCount !== undefined) {
				const sendBuffer = new Uint8Array(1 + 4 + 4);
				const writer = Data.createWriter(sendBuffer);

				writer.writeByte(SendCode.SETTINGS_UPDATE);
				writer.writeInt(SettingCode.MINE_COUNT);
				writer.writeInt(setSetting.mineCount);

				return sendBuffer;
			} else {
				throw Error('Invalid set setting object');
			}
		},
	);

	export const teamNameUpdate = Socket.registerSender(
		(teamId: number, name: string) => {
			const nameBuffer = Data.textEncoder.encode(name);

			const sendBuffer = new Uint8Array(1 + 4 + 2 + nameBuffer.length);
			const writer = Data.createWriter(sendBuffer);

			writer.writeByte(SendCode.TEAM_NAME_UPDATE);
			writer.writeInt(teamId);
			writer.writeString(nameBuffer);

			return sendBuffer;
		},
	);

	export const join = Socket.registerSender(
		(
			rejoinId: number | undefined,
			rejoinTeamId: number | undefined,
			color: Color,
			alive: boolean,
			name: string,
		) => {
			const nameBuffer = Data.textEncoder.encode(name);

			const sendBuffer = new Uint8Array(
				1 + 4 + 4 + 3 + 1 + 2 + nameBuffer.length,
			);
			const writer = Data.createWriter(sendBuffer);

			writer.writeByte(SendCode.SELF_JOIN);
			writer.writeInt(rejoinId ?? 0);
			writer.writeInt(rejoinTeamId ?? 0);
			writer.writeByte(color[0]);
			writer.writeByte(color[1]);
			writer.writeByte(color[2]);
			writer.writeBool(!alive);
			writer.writeString(nameBuffer);

			return sendBuffer;
		},
	);
}
