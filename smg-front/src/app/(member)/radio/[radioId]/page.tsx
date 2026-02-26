'use client';

import { RadioDetail } from '@/components/radio/RadioDetail';
import type { RadioData } from '@/components/radio/types';
import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import { Container } from '@/styled-system/jsx';
import React, { useEffect, useState } from 'react';

export default function RadioDetailPage({
	params,
}: { params: { radioId: string } }) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [radioData, setRadioData] = useState<RadioData | null>(null);

	useEffect(() => {
		const fetchRadioDetail = async () => {
			try {
				setLoading(true);
				const supabase = createClient();

				// ログインユーザーのIDを取得
				const {
					data: { user },
				} = await supabase.auth.getUser();
				const userId = user?.id;

				// ユーザーが所属するグループのIDを取得
				let userGroupIds: string[] = [];
				if (userId) {
					const { data: userGroups, error: userGroupError } = await supabase
						.from('trn_group_user')
						.select('group_id')
						.eq('user_id', userId)
						.is('deleted_at', null);

					if (userGroupError) {
						console.error('Error fetching user groups:', userGroupError);
					} else {
						userGroupIds = userGroups.map((ug) => ug.group_id);
					}
				}

				// ラジオデータを取得
				const { data: radio, error: radioError } = await supabase
					.from('mst_radio')
					.select('*')
					.eq('radio_id', params.radioId)
					.is('deleted_at', null)
					.eq('is_draft', false)
					.single();

				if (radioError || !radio) {
					throw new Error('ラジオデータが見つかりませんでした');
				}

				// 配信期間チェック
				const now = new Date();
				const startDate = radio.publish_start_at
					? new Date(radio.publish_start_at)
					: null;
				const endDate = radio.publish_end_at
					? new Date(radio.publish_end_at)
					: null;

				if (startDate && now < startDate) {
					throw new Error('この配信はまだ開始されていません');
				}

				if (endDate && now > endDate) {
					throw new Error('この配信は終了しました');
				} // ラジオの表示制限をチェック
				const { data: restrictionData, error: restrictionError } =
					await supabase
						.from('trn_radio_visible_group')
						.select('group_id')
						.eq('radio_id', params.radioId)
						.is('deleted_at', null);

				if (restrictionError) {
					console.error('Error fetching restriction data:', restrictionError);
				}

				// 制限がある場合、ユーザーのグループで表示可能かチェック
				if (restrictionData && restrictionData.length > 0) {
					const hasAccess = restrictionData.some((r) =>
						userGroupIds.includes(r.group_id),
					);
					if (!hasAccess) {
						throw new Error('このラジオへのアクセス権限がありません');
					}
				}

				// ラジオのデータを整形
				setRadioData({
					id: radio.radio_id,
					name: radio.radio_name,
					imageUrl: radio.image_url,
					radioUrl: radio.radio_url,
					registrationStartAt: radio.publish_start_at,
					registrationEndAt: radio.publish_end_at,
					description: radio.radio_description,
					createdAt: radio.created_at,
					updatedAt: radio.updated_at,
				});
			} catch (err) {
				console.error('ラジオの取得エラー:', err);
				if (err instanceof Error) {
					setError(err.message);
				} else {
					setError('ラジオの取得中にエラーが発生しました');
				}
			} finally {
				setLoading(false);
			}
		};

		fetchRadioDetail();
	}, [params.radioId]);

	if (loading) {
		return (
			<Container
				mx="auto"
				py={{ base: '4', md: '6' }}
				px={{ base: '3', md: '4' }}
				maxWidth={{ base: '100%', md: '700px' }}
			>
				<div
					className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}
				>
					読み込み中...
				</div>
			</Container>
		);
	}

	if (error || !radioData) {
		return (
			<Container
				mx="auto"
				py={{ base: '4', md: '6' }}
				px={{ base: '3', md: '4' }}
				maxWidth={{ base: '100%', md: '700px' }}
			>
				<div
					className={css({ textAlign: 'center', py: '8', color: 'red.500' })}
				>
					{error || 'ラジオデータが見つかりませんでした'}
				</div>
			</Container>
		);
	}

	return (
		<Container
			mx="auto"
			py={{ base: '4', md: '6' }}
			px={{ base: '3', md: '4' }}
			maxWidth={{ base: '100%', md: '700px' }}
		>
			<RadioDetail radioData={radioData} />
		</Container>
	);
}
