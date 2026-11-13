import HeroHeader from '@/components/HeroHeader';
import { desktopBentoSlots } from '@/content/bento-slots';
import { headerPhotoPool } from '@/content/header-photos';
import { siteConfig } from '@/content/site.config';
import { assignHeroPhotos, dailyBentoSeed } from '@/lib/bento-assign';

export default function HeroHeaderServer() {
	const seed = dailyBentoSeed(siteConfig.communityName);
	const photos = assignHeroPhotos(headerPhotoPool, desktopBentoSlots, seed);

	return <HeroHeader photos={photos} />;
}
