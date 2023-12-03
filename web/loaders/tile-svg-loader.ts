const load = (content: string | Buffer) => {
	const contentString =
		typeof content === 'string' ? content : content.toString();

	const parser = new DOMParser();
	const document = parser.parseFromString(contentString, 'image/svg+xml');

	const svg = document.getRootNode();
};

export default load;
