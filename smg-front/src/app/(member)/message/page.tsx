'use client';

import { Centerize } from '@/components/layout';
import { MessageField } from '@/features/messages/components/message-field';
import { MessageView } from '@/features/messages/components/message-view';
import { getUserThread } from '@/lib/api/messages';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LuChevronLeft } from 'react-icons/lu';

const Page = () => {
	// メッセージリストを更新するためのステート
	const [refreshCounter, setRefreshCounter] = useState(0);
	// スレッドIDを共有するためのステート
	const [threadId, setThreadId] = useState<string | null>(null);
	// 初期ロード中かどうか
	const [loading, setLoading] = useState(true);

	// 初回レンダリング時に既存のスレッドを確認（作成はしない）
	useEffect(() => {
		const checkExistingThread = async () => {
			try {
				const thread = await getUserThread();
				if (thread) {
					setThreadId(thread.thread_id);
				}
			} catch (error) {
				console.error('スレッド確認エラー:', error);
			} finally {
				setLoading(false);
			}
		};

		checkExistingThread();
	}, []);

	// スレッドが新規作成された時のコールバック
	const handleThreadCreated = (newThreadId: string) => {
		setThreadId(newThreadId);
	};

	// メッセージ送信後のコールバック
	const handleMessageSent = () => {
		setRefreshCounter((prev) => prev + 1);
	};

	// ローディング中はスケルトンを表示
	if (loading) {
		return (
			<Centerize
				className={css({
					py: { base: '4', smDown: '0' },
				})}
				size="md"
			>
				<div className={css({ textAlign: 'center', py: '4' })}>
					読み込み中...
				</div>
			</Centerize>
		);
	}

	return (
		<Centerize
			className={css({
				py: { base: '4', smDown: '0' },
			})}
			size="md"
		>
			<div
				className={css({
					bg: 'white',
					rounded: 'md',
					px: '4',
					py: '2',
					smDown: {
						display: 'flex',
						flexDirection: 'column',
						h: '80vh',
					},
				})}
			>
				{/* Header */}
				<div className={css({ py: '4', textAlign: 'center', pos: 'relative' })}>
					<h2 className={css({ fontWeight: 'bold', fontSize: 'xl' })}>
						管理者とのメッセージ
					</h2>
					<Link
						className={css({
							pos: 'absolute',
							top: '50%',
							left: 0,
							transform: 'translateY(-50%)',
						})}
						href="/"
					>
						<LuChevronLeft size={32} />
					</Link>
				</div>

				{/* Content */}
				<div
					className={css({
						display: 'grid',
						gridTemplateColumns: '1fr',
						minH: '65vh',
						gridTemplateRows: {
							base: 'minmax(65vh, 70vh) auto',
							smDown: '1fr auto',
						},
						h: 'full',
					})}
				>
					{/* メッセージビュー */}
					<MessageView refreshCounter={refreshCounter} threadId={threadId} />
					{/* メッセージ入力フィールド */}
					<MessageField
						threadId={threadId}
						onSent={handleMessageSent}
						onThreadCreated={handleThreadCreated}
					/>
				</div>
			</div>
		</Centerize>
	);
};

export default Page;
