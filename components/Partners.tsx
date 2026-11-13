'use client';

import React from 'react';
import Image from 'next/image';
import { partners } from '@/content/partners';
import { useI18n } from '@/lib/i18n';

const Partners: React.FC = () => {
	const { t } = useI18n();

	if (partners.length === 0) {
		return null;
	}

	return (
		<section className="mb-10">
			<h3 className="cursor-eyebrow mb-4">{t('footer.hostingPartners')}</h3>
			<div className="grid grid-cols-2 border-l border-t border-cursor-border sm:grid-cols-3 lg:grid-cols-5">
				{partners.map((partner) => (
					<a
						key={partner.name}
						href={partner.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={partner.name}
						className="group relative aspect-[4/3] overflow-hidden border-b border-r border-cursor-border bg-cursor-surface transition-colors duration-150 hover:bg-cursor-surface-raised focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cursor-accent-orange/60"
					>
						<div
							className="absolute inset-[18%] overflow-hidden rounded-sm opacity-60 grayscale transition-[filter,opacity,transform] duration-200 group-hover:scale-[1.02] group-hover:opacity-100 group-hover:grayscale-0"
							style={{ backgroundColor: partner.logoBg ?? '#ffffff' }}
						>
							<Image
								src={partner.logo}
								alt={partner.name}
								fill
								className="object-contain p-2"
								sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
							/>
						</div>
					</a>
				))}
			</div>
		</section>
	);
};

export default Partners;
