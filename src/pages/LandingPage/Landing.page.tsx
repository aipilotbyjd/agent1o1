import Container from '@/components/layout/Container';
import Wrapper from '@/components/layout/Wrapper';
import SectionHeaderLanding from '@/pages/LandingPage/SectionHeader.landing';
import SectionHeroLanding from '@/pages/LandingPage/SectionHero.landing';
import SectionIconLanding from '@/pages/LandingPage/SectionIcon.landing';
import SectionComponentsLanding from '@/pages/LandingPage/SectionComponents.landing';
import SectionTemplateLanding from '@/pages/LandingPage/SectionTemplate.landing';
import SectionResponsiveLanding from '@/pages/LandingPage/SectionResponsive.landing';
import SectionFooterLanding from '@/pages/LandingPage/SectionFooter.landing';

const LandingPage = () => {
	return (
		<Wrapper className='border-s-[1rem]!'>
			<SectionHeaderLanding />
			<Container className='overflow-x-hidden'>
				<SectionHeroLanding />
				<SectionIconLanding />
				<SectionComponentsLanding />
				<SectionTemplateLanding />
				<SectionResponsiveLanding />
				<SectionFooterLanding />
			</Container>
		</Wrapper>
	);
};

export default LandingPage;
