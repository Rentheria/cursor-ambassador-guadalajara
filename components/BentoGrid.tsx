'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Image from 'next/image';
import { isPriorityPhoto } from '@/lib/bento-assign';
import { HeaderPhoto } from '@/lib/types';

type BentoGridProps = {
	desktopPhotos: HeaderPhoto[];
	mobilePhotos: HeaderPhoto[];
	cols?: number;
	rows?: number;
	mobileCols?: number;
	mobileRows?: number;
	gapClassName?: string;
};

type TileVariant = 'desktop' | 'mobile';

type ExpandedTile = {
	variant: TileVariant;
	index: number;
};

const HERO_EXPAND_LAYOUT_ID = 'hero-expanded-photo';
const EXPAND_LAYOUT_MS = 220;

function toGridPlacement(start: number, span?: number) {
	return `${start} / span ${span ?? 1}`;
}

function getSizes(colSpan: number, cols: number, fallback = 100) {
	const ratio = Math.min(1, Math.max(colSpan / cols, 0));
	return `${Math.round(ratio * fallback)}vw`;
}

function heroExpandLayoutId(variant: TileVariant, index: number): string {
	return `${HERO_EXPAND_LAYOUT_ID}-${variant}-${index}`;
}

function layoutTransition(reducedMotion: boolean) {
	return reducedMotion ? { duration: 0 } : { duration: EXPAND_LAYOUT_MS / 1000, ease: [0.22, 1, 0.36, 1] as const };
}

function BentoTile({
	photo,
	tileIndex,
	variant,
	cols,
	priority,
	expanded,
	isExpanded,
	onExpand,
	reducedMotion,
	buttonRef,
}: {
	photo: HeaderPhoto;
	tileIndex: number;
	variant: TileVariant;
	cols: number;
	priority: boolean;
	expanded: ExpandedTile | null;
	isExpanded: boolean;
	onExpand: (variant: TileVariant, index: number) => void;
	reducedMotion: boolean;
	buttonRef: (node: HTMLButtonElement | null) => void;
}) {
	const expandable = Boolean(photo.src);

	return (
		<motion.div
			initial={false}
			animate={{
				opacity: expanded !== null && !isExpanded ? 0 : 1,
				scale: 1,
			}}
			transition={
				reducedMotion
					? { duration: 0 }
					: {
							duration: 0.15,
							ease: [0.22, 1, 0.36, 1],
						}
			}
			className="relative overflow-hidden bg-cursor-bg-dark"
			style={{
				gridRow: toGridPlacement(photo.row, photo.rowSpan),
				gridColumn: toGridPlacement(photo.col, photo.colSpan),
			}}
		>
			<button
				ref={buttonRef}
				type="button"
				disabled={!expandable || isExpanded}
				onClick={() => onExpand(variant, tileIndex)}
				aria-label="Expand photo"
				aria-expanded={isExpanded}
				className={`relative block h-full w-full appearance-none border-0 bg-transparent p-0 text-left ${
					expandable && !isExpanded
						? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cursor-accent-orange/60'
						: 'cursor-default'
				}`}
			>
				{isExpanded ? (
					<div className="absolute inset-0 bg-cursor-bg-dark" aria-hidden />
				) : (
					<motion.div layoutId={heroExpandLayoutId(variant, tileIndex)} className="absolute inset-0">
						<Image
							src={photo.src}
							alt={photo.alt}
							fill
							className="object-cover"
							sizes={getSizes(photo.colSpan ?? 1, cols)}
							priority={priority}
						/>
					</motion.div>
				)}
			</button>
		</motion.div>
	);
}

const BentoGrid: React.FC<BentoGridProps> = ({
	desktopPhotos,
	mobilePhotos,
	cols = 4,
	rows = 4,
	mobileCols = 2,
	mobileRows = 4,
	gapClassName = 'gap-1',
}) => {
	const [expanded, setExpanded] = useState<ExpandedTile | null>(null);
	const [reducedMotion, setReducedMotion] = useState(false);
	const tileButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

	useEffect(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => setReducedMotion(media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	}, []);

	useEffect(() => {
		if (expanded === null) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				const key = `${expanded.variant}-${expanded.index}`;
				setExpanded(null);
				requestAnimationFrame(() => tileButtonRefs.current[key]?.focus());
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [expanded]);

	const handleExpand = useCallback((variant: TileVariant, index: number) => {
		setExpanded({ variant, index });
	}, []);

	const handleCollapse = useCallback(() => {
		if (!expanded) return;
		const key = `${expanded.variant}-${expanded.index}`;
		setExpanded(null);
		requestAnimationFrame(() => tileButtonRefs.current[key]?.focus());
	}, [expanded]);

	const expandedPhoto =
		expanded === null
			? null
			: expanded.variant === 'desktop'
				? desktopPhotos[expanded.index]
				: mobilePhotos[expanded.index];

	return (
		<LayoutGroup id="hero-expand">
			<div
				className={`grid md:hidden h-full ${gapClassName}`}
				style={{
					gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`,
					gridTemplateRows: `repeat(${mobileRows}, minmax(0, 1fr))`,
				}}
			>
				{mobilePhotos.map((photo, index) => (
					<BentoTile
						key={`mobile-${photo.src}-${photo.row}-${photo.col}`}
						photo={photo}
						tileIndex={index}
						variant="mobile"
						cols={mobileCols}
						priority={isPriorityPhoto(photo, mobilePhotos)}
						expanded={expanded}
						isExpanded={expanded?.variant === 'mobile' && expanded.index === index}
						onExpand={handleExpand}
						reducedMotion={reducedMotion}
						buttonRef={(node) => {
							tileButtonRefs.current[`mobile-${index}`] = node;
						}}
					/>
				))}
			</div>

			<div
				className={`hidden md:grid h-full ${gapClassName}`}
				style={{
					gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
					gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
				}}
			>
				{desktopPhotos.map((photo, index) => (
					<BentoTile
						key={`desktop-${photo.src}-${photo.row}-${photo.col}`}
						photo={photo}
						tileIndex={index}
						variant="desktop"
						cols={cols}
						priority={isPriorityPhoto(photo, desktopPhotos)}
						expanded={expanded}
						isExpanded={expanded?.variant === 'desktop' && expanded.index === index}
						onExpand={handleExpand}
						reducedMotion={reducedMotion}
						buttonRef={(node) => {
							tileButtonRefs.current[`desktop-${index}`] = node;
						}}
					/>
				))}
			</div>

			<AnimatePresence>
				{expanded !== null && expandedPhoto?.src ? (
					<motion.button
						key="hero-expanded"
						type="button"
						initial={{ opacity: reducedMotion ? 1 : 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: reducedMotion ? 1 : 0 }}
						transition={{ duration: reducedMotion ? 0 : 0.2 }}
						onClick={handleCollapse}
						aria-label="Show photo grid"
						className="absolute inset-0 z-30 cursor-pointer appearance-none border-0 bg-cursor-bg-dark p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-cursor-accent-orange/60"
					>
						<motion.div
							layoutId={heroExpandLayoutId(expanded.variant, expanded.index)}
							layout
							transition={layoutTransition(reducedMotion)}
							className="absolute inset-0"
						>
							<Image
								src={expandedPhoto.src}
								alt={expandedPhoto.alt}
								fill
								priority
								className="object-cover"
								sizes="100vw"
							/>
						</motion.div>
					</motion.button>
				) : null}
			</AnimatePresence>
		</LayoutGroup>
	);
};

export default BentoGrid;
