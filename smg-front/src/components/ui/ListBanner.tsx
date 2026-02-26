import type React from 'react';
import { styled } from '../../../styled-system/jsx';

interface ListBannerProps {
	imageSrc: string;
	alt: string;
}

const LogoContainer = styled('div', {
	base: {
		width: 'full',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

const LogoWrapper = styled('div', {
	base: {
		width: '100%',
		height: 'auto',
		mb: '2',
	},
});

const Image = styled('img', {
	base: {
		width: '100%',
		height: 'auto',
		objectFit: 'contain',
	},
});

const ListBanner: React.FC<ListBannerProps> = ({ imageSrc, alt }) => {
	return (
		<LogoContainer>
			<LogoWrapper>
				<Image src={imageSrc} alt={alt} />
			</LogoWrapper>
		</LogoContainer>
	);
};

export const TopBanner = ({ alt = '' }: { alt?: string }) => {
	return <ListBanner imageSrc="/banner.png" alt={alt} />;
};

export default ListBanner;
