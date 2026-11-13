'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { worldEventPhotos } from '@/content/world-events';

const WorldEventsCarousel: React.FC = () => {
	const photos = worldEventPhotos;
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFullscreen, setIsFullscreen] = useState(false);

	if (photos.length === 0) {
		return null;
	}

	const currentPhoto = photos[currentIndex];

	return (
		<>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
				{photos.map((photo, index) => (
					<button
						key={index}
						type="button"
						className="relative aspect-square cursor-pointer overflow-hidden rounded-sm border border-cursor-border text-left"
						onClick={() => {
							setCurrentIndex(index);
							setIsFullscreen(true);
						}}
					>
						<Image
							src={photo.src}
							alt={photo.alt}
							fill
							className="object-cover"
							sizes="(max-width: 768px) 50vw, 33vw"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
							<div className="absolute bottom-0 left-0 right-0 p-3">
								<p className="text-white text-sm font-medium">{photo.location}</p>
								{photo.date ? <p className="text-white/80 text-xs">{photo.date}</p> : null}
							</div>
						</div>
					</button>
				))}
			</div>

			<AnimatePresence>
				{isFullscreen ? (
					<div
						className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
						onClick={() => setIsFullscreen(false)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="relative max-w-6xl w-full max-h-[90vh]"
							onClick={(event) => event.stopPropagation()}
						>
							<button
								onClick={() => setIsFullscreen(false)}
								className="absolute top-4 right-4 z-10 rounded-full border border-cursor-border bg-cursor-bg/80 p-2 text-cursor-text transition-colors hover:bg-cursor-bg"
								aria-label="Close"
							>
								<X className="w-5 h-5" />
							</button>

							<div className="relative w-full h-[80vh] mb-4">
								<AnimatePresence mode="wait">
									<motion.div
										key={currentIndex}
										initial={{ opacity: 0, x: 100 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -100 }}
										transition={{ duration: 0.3 }}
										className="relative w-full h-full"
									>
										<Image src={currentPhoto.src} alt={currentPhoto.alt} fill className="object-contain" sizes="90vw" />
									</motion.div>
								</AnimatePresence>
							</div>

							<div className="rounded-sm border border-cursor-border bg-cursor-bg p-4 text-center">
								<p className="text-cursor-text font-medium mb-1">{currentPhoto.location}</p>
								<p className="text-cursor-text-muted text-sm">{currentPhoto.date}</p>
							</div>

							{photos.length > 1 ? (
								<>
									<button
										onClick={() => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)}
										className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-cursor-border bg-cursor-bg/80 p-2 text-cursor-text transition-colors hover:bg-cursor-bg"
										aria-label="Previous photo"
									>
										<ChevronLeft className="w-6 h-6" />
									</button>
									<button
										onClick={() => setCurrentIndex((prev) => (prev + 1) % photos.length)}
										className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-cursor-border bg-cursor-bg/80 p-2 text-cursor-text transition-colors hover:bg-cursor-bg"
										aria-label="Next photo"
									>
										<ChevronRight className="w-6 h-6" />
									</button>
								</>
							) : null}
						</motion.div>
					</div>
				) : null}
			</AnimatePresence>
		</>
	);
};

export default WorldEventsCarousel;
