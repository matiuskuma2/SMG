'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { css } from '@/styled-system/css';
import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QRCodeModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface QRCodeResponse {
	success: boolean;
	qrImage?: string;
	qrToken?: string;
	error?: string;
	message?: string;
}

export const QRCodeModal = ({ isOpen, onClose }: QRCodeModalProps) => {
	const [qrImage, setQrImage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen) {
			fetchQRCode();
		} else {
			// モーダルが閉じられたらリセット
			setQrImage(null);
			setError(null);
		}
	}, [isOpen]);

	const fetchQRCode = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/mypage/qr-code');
			const data: QRCodeResponse = await response.json();

			if (response.ok && data.success && data.qrImage) {
				setQrImage(data.qrImage);
			} else {
				if (response.status === 404) {
					setError(data.message || 'QRコードが見つかりません');
				} else {
					setError(data.error || 'QRコードの取得に失敗しました');
				}
			}
		} catch (err) {
			console.error('QRCode fetch error:', err);
			setError('QRコードの取得中にエラーが発生しました');
		} finally {
			setIsLoading(false);
		}
	};

	const handleContentClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				onClick={handleContentClick}
				className={css({
					maxWidth: '400px',
					borderRadius: 'lg',
				})}
			>
				<DialogHeader
					className={css({
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					})}
				>
					<DialogTitle>会員QRコード</DialogTitle>
					<button
						type="button"
						onClick={onClose}
						className={css({
							p: '2',
							borderRadius: 'md',
							_hover: { bg: 'gray.100' },
							transition: 'background-color 0.2s',
						})}
					>
						<X className={css({ h: '5', w: '5', color: 'gray.500' })} />
					</button>
				</DialogHeader>

				<div
					className={css({
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						minHeight: '280px',
						py: '4',
					})}
				>
					{isLoading && (
						<div
							className={css({
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '3',
							})}
						>
							<Loader2
								className={css({
									h: '8',
									w: '8',
									color: 'gray.400',
									animation: 'spin 1s linear infinite',
								})}
							/>
							<p className={css({ color: 'gray.500', fontSize: 'sm' })}>
								QRコードを読み込み中...
							</p>
						</div>
					)}

					{!isLoading && error && (
						<div
							className={css({
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '3',
								textAlign: 'center',
								px: '4',
							})}
						>
							<p className={css({ color: 'red.500', fontSize: 'sm' })}>
								{error}
							</p>
							<button
								type="button"
								onClick={fetchQRCode}
								className={css({
									px: '4',
									py: '2',
									bg: 'gray.100',
									borderRadius: 'md',
									fontSize: 'sm',
									_hover: { bg: 'gray.200' },
									transition: 'background-color 0.2s',
								})}
							>
								再試行
							</button>
						</div>
					)}

					{!isLoading && !error && qrImage && (
						<div
							className={css({
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '4',
							})}
						>
							<img
								src={qrImage}
								alt="会員QRコード"
								className={css({
									w: '200px',
									h: '200px',
									border: '1px solid',
									borderColor: 'gray.200',
									borderRadius: 'md',
								})}
							/>
							<p className={css({ color: 'gray.500', fontSize: 'xs' })}>
								このQRコードを会員証としてご利用ください
							</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
