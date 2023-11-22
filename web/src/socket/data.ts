export namespace Data {
	export const textDecoder = new TextDecoder();
	export const textEncoder = new TextEncoder();

	export type Reader = {
		getByte(): number;
		getBool(): boolean;
		getInt(): number;
		getFloat(): number;
		getString(): string;
		getByteArray(length: number): Uint8Array;
		getIntArray(length: number): DataView;
	};

	export const createReader = (data: ArrayBuffer): Reader => {
		const view = new DataView(data);
		let offset = 0;

		return {
			getByte: () => {
				const value = view.getUint8(offset);
				offset += 1;
				return value;
			},
			getBool: () => {
				const value = view.getUint8(offset);
				offset += 1;
				return value !== 0;
			},
			getInt: () => {
				const value = view.getInt32(offset);
				offset += 4;
				return value;
			},
			getFloat: () => {
				const value = view.getFloat32(offset);
				offset += 4;
				return value;
			},
			getString: () => {
				const stringLength = view.getUint16(offset);
				const value = textDecoder.decode(
					new DataView(data, offset + 2, stringLength),
				);
				offset += 2 + stringLength;
				return value;
			},
			getByteArray: (length: number): Uint8Array => {
				const value = new Uint8Array(data, offset, length);
				offset += length;
				return value;
			},
			getIntArray: (length: number): DataView => {
				const value = new DataView(data, offset, length * 4);
				offset += length * 4;
				return value;
			},
		};
	};

	export type Writer = {
		writeByte(byte: number): void;
		writeBool(bool: boolean): void;
		writeInt(int: number): void;
		writeFloat(float: number): void;
		writeString(encoded: Uint8Array): void;
	};

	export const createWriter = (data: Uint8Array): Writer => {
		const view = new DataView(data.buffer);
		let offset = 0;

		return {
			writeByte: (byte: number) => {
				view.setInt8(offset, byte);
				offset += 1;
			},
			writeBool: (bool: boolean) => {
				view.setInt8(offset, bool ? 1 : 0);
				offset += 1;
			},
			writeFloat: (float: number) => {
				view.setFloat32(offset, float);
				offset += 4;
			},
			writeInt: (int: number) => {
				view.setInt32(offset, int);
				offset += 4;
			},
			writeString: (encoded: Uint8Array) => {
				view.setUint16(offset, encoded.length);
				data.set(encoded, offset + 2);
				offset += 2 + encoded.length;
			},
		};
	};

	export const readArray = <T>(size: number, callback: () => T) => {
		return Array.from(new Array(size), callback);
	};
}
