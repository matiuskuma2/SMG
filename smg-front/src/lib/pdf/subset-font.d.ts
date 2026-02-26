declare module 'subset-font' {
	interface SubsetFontOptions {
		targetFormat?: 'sfnt' | 'woff' | 'woff2' | 'truetype';
	}
	export default function subsetFont(
		buffer: Buffer | Uint8Array,
		text: string,
		options?: SubsetFontOptions,
	): Promise<Uint8Array>;
}
