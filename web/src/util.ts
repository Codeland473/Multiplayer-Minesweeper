export const short = (error: Error) => {
	throw error;
};

export const randIntRange = (low: number, high: number) => {
	return Math.floor(Math.random() * (high - low + 1)) + low;
};

const hexDigits = '0123456789ABCDEF';

const twoDigitHex = (number: number) =>
	`${hexDigits[Math.floor(number / 16)]}${hexDigits[number % 16]}`;

export const rgbToHex = (red: number, green: number, blue: number): string => {
	return `#${twoDigitHex(red)}${twoDigitHex(green)}${twoDigitHex(blue)}`;
};

export const hexToRgb = (hex: string): [number, number, number] => {
	const int = Number.parseInt(hex.slice(1), 16);
	return [int >> 16, (int >> 8) & 0xff, int & 0xff];
};

Object.assign(window, { hexToRgb, rgbToHex, twoDigitHex });

export const groupBy = <Type>(
	array: readonly Type[],
	splitter: (element: Type) => string | number,
): { [key: string | number]: Type[] } => {
	const obj: { [key: string | number]: Type[] } = {};

	for (const element of array) {
		const key = splitter(element);
		(obj[key] ??= []).push(element);
	}

	return obj;
};
