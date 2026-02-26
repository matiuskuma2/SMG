'use client';

import { css } from '@/styled-system/css';
import { Box } from '@/styled-system/jsx';
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react';

const ReactQuill = dynamic(
	async () => {
		const { default: RQ } = await import('react-quill-new');
		const { default: QuillLib } = await import('quill');

		// カスタムImageFormatを登録して、style属性を保持する
		const ImageBlot = QuillLib.import('formats/image') as any;
		class CustomImageFormat extends ImageBlot {
			static formats(domNode: HTMLElement) {
				return {
					alt: domNode.getAttribute('alt'),
					height: domNode.getAttribute('height'),
					width: domNode.getAttribute('width'),
					style: domNode.getAttribute('style'),
				};
			}

			format(name: string, value: string) {
				if (
					name === 'alt' ||
					name === 'height' ||
					name === 'width' ||
					name === 'style'
				) {
					if (value) {
						(this as any).domNode.setAttribute(name, value);
					} else {
						(this as any).domNode.removeAttribute(name);
					}
				} else {
					super.format(name, value);
				}
			}
		}

		QuillLib.register(CustomImageFormat as any, true);

		return RQ;
	},
	{ ssr: false },
);
import 'react-quill-new/dist/quill.snow.css';

interface RichContentDisplayProps {
	content: string;
	isHtml?: boolean;
}

// HTMLコンテンツ内のURLを自動的にリンク化する関数
const linkifyHtmlUrls = (htmlContent: string): string => {
	// HTMLタグ内のURLは除外し、テキストコンテンツのURLのみをリンク化
	const urlRegex = /(?<!href=["'])(https?:\/\/[^\s<>"]+)(?![^<]*>)/gi;

	return htmlContent.replace(urlRegex, (url) => {
		return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${url}</a>`;
	});
};

export const RichContentDisplay = ({
	content,
	isHtml = false,
}: RichContentDisplayProps) => {
	const [expandedImage, setExpandedImage] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isHtml || !containerRef.current) {
			return;
		}

		const handleImageClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;

			if (target.tagName === 'IMG') {
				const img = target as HTMLImageElement;
				setExpandedImage(img.src);
			}
		};

		const container = containerRef.current;
		container.addEventListener('click', handleImageClick);

		return () => {
			container.removeEventListener('click', handleImageClick);
		};
	}, [isHtml, content]);

	if (isHtml) {
		// HTMLコンテンツのURLをリンク化
		const linkedContent = linkifyHtmlUrls(content);

		return (
			<>
				<Box
					ref={containerRef}
					className={css({
						'& .ql-editor': {
							padding: '0 !important',
							minHeight: 'auto !important',
							maxHeight: 'none !important',
							border: 'none !important',
							outline: 'none !important',
						},
						'& .ql-container': {
							border: 'none !important',
							fontSize: 'inherit',
						},
						'& .ql-container.ql-snow': {
							border: 'none !important',
							background: 'transparent',
						},
						'& .ql-snow': {
							border: 'none !important',
						},
						'& .ql-toolbar': {
							display: 'none !important',
						},
						'& .ql-editor a': {
							color: '#2563eb',
							textDecoration: 'underline',
							cursor: 'pointer',
						},
						'& .ql-editor a:hover': {
							color: '#1d4ed8',
						},
					})}
				>
					<ReactQuill
						value={linkedContent}
						readOnly={true}
						theme="snow"
						modules={{ toolbar: false }}
					/>
				</Box>

				{expandedImage && (
					<Box
						className={css({
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: 'rgba(0, 0, 0, 0.9)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 1000,
							cursor: 'pointer',
						})}
						onClick={() => setExpandedImage(null)}
					>
						<button
							onClick={() => setExpandedImage(null)}
							className={css({
								position: 'absolute',
								top: '20px',
								right: '20px',
								width: '40px',
								height: '40px',
								backgroundColor: 'rgba(255, 255, 255, 0.9)',
								border: 'none',
								borderRadius: '50%',
								cursor: 'pointer',
								display: 'flex',
								justifyContent: 'center',
								fontSize: '24px',
								fontWeight: 'bold',
								color: '#333',
								transition: 'background-color 0.2s',
								zIndex: 1001,
								_hover: {
									backgroundColor: 'rgba(255, 255, 255, 1)',
								},
							})}
						>
							×
						</button>
						<img
							src={expandedImage}
							alt="拡大画像"
							className={css({
								maxWidth: '90%',
								maxHeight: '90%',
								objectFit: 'contain',
							})}
						/>
					</Box>
				)}
			</>
		);
	}

	return <Box whiteSpace="pre-wrap">{content}</Box>;
};
