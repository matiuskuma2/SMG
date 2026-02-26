import React from 'react';
import { styled } from '../../../styled-system/jsx';

const LogoContainer = styled('div', {
  base: {
    width: 'full',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

const LogoWrapper = styled('div', {
  base: {
    width: '100%',
    height: 'auto',
    mb: '2'
  }
});

const Image = styled('img', {
  base: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain'
  }
});



const Banner = () => {
  return (
    <LogoContainer>
      <LogoWrapper>
        <Image src="/banner.png" alt="smglogo" />
      </LogoWrapper>
    </LogoContainer>
  );
};

export default Banner;
