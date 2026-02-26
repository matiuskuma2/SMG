import { SearchForm } from '@/components/search/SearchForm';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { NavLink } from '@/features/top/components/layout';
import { Navigation } from '@/features/top/components/layout/navigation';
import { NotificationNavLink } from '@/features/top/components/layout/NotificationNavLink';
import { Drawer } from '@/features/top/components/parts';
import { createClient } from '@/lib/supabase-server';
import { css } from '@/styled-system/css';
import Image from 'next/image';
import Link from 'next/link';

const getProfileIcon = async () => {
	const client = createClient();
	const {
		data: { user },
	} = await client.auth.getUser();

	if (!user) return null;

	const { data: profile } = await client
		.from('mst_user')
		.select('icon')
		.eq('user_id', user.id)
		.is('deleted_at', null)
		.single();

	return profile?.icon ?? undefined;
};

export const Header = async () => {
	const icon = await getProfileIcon();
	return (
		<header
			className={css({
				display: 'flex',
				flexDir: 'column',
				alignItems: 'center',
				color: 'white',
				bg: 'bg-black',
				px: 6,
				pb: {
					base: 3,
					mdDown: 0,
				},
				gap: 2,
				position: 'sticky',
				top: 0,
				zIndex: 50,
			})}
		>
			<div
				className={css({
					w: 'full',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					color: 'white',
					bg: 'bg-black',
					h: '56px',
				})}
			>
				<h1>
					<Link href="/">
						<Image
							src={'/top/logo.svg'}
							width={150}
							height={20}
							alt="smg経営塾"
						/>
					</Link>
				</h1>
				<div
					className={css({
						display: 'flex',
						alignItems: 'center',
						gap: '4',
					})}
				>
					<div className={css({ hideBelow: 'md' })}>
						<SearchForm />
					</div>

					<NotificationNavLink />
					<NavLink
						label="問い合わせ"
						href="/message"
						iconUrl="/top/icons/contact.png"
					/>
					{icon !== null && (
						<Link
							href={'/mypage'}
							className={css({ cursor: 'pointer', hideBelow: 'md' })}
						>
							<UserAvatar src={icon} />
						</Link>
					)}

					<Drawer />
				</div>
			</div>
			<Navigation />{' '}
		</header>
	);
};
