import { BentoImage, BentoSlot, HeaderPhoto, HeroBentoPhotos } from '@/lib/types';

function hashString(input: string): number {
	let hash = 2166136261;
	for (let i = 0; i < input.length; i += 1) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function mulberry32(seed: number) {
	return () => {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function seededShuffle<T>(items: T[], seed: string): T[] {
	const result = [...items];
	const random = mulberry32(hashString(seed));

	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}

	return result;
}

function mobileVisibleSlots(slots: BentoSlot[]): BentoSlot[] {
	return slots
		.filter((slot) => !slot.mobileHidden)
		.map((slot) => {
			const mobile = slot.mobile ?? {
				row: slot.row,
				col: slot.col,
				rowSpan: slot.rowSpan,
				colSpan: slot.colSpan,
			};

			return {
				row: mobile.row,
				col: mobile.col,
				rowSpan: mobile.rowSpan,
				colSpan: mobile.colSpan,
			};
		});
}

export function assignPhotosToSlots(pool: BentoImage[], slots: BentoSlot[], seed: string): HeaderPhoto[] {
	if (pool.length < slots.length) {
		console.warn(
			`[bento] Image pool (${pool.length}) is smaller than slot count (${slots.length}). Images will repeat.`,
		);
	}

	const shuffled = seededShuffle(pool, seed);

	return slots.map((slot, index) => ({
		...slot,
		...shuffled[index % shuffled.length],
	}));
}

export function assignHeroPhotos(pool: BentoImage[], slots: BentoSlot[], seed: string): HeroBentoPhotos {
	return {
		desktop: assignPhotosToSlots(pool, slots, seed),
		mobile: assignPhotosToSlots(pool, mobileVisibleSlots(slots), `${seed}:m`),
	};
}

export function dailyBentoSeed(communityName: string, date = new Date()): string {
	const day = date.toISOString().slice(0, 10);
	return `${day}:${communityName}`;
}

export function slotArea(slot: Pick<BentoSlot, 'rowSpan' | 'colSpan'>): number {
	return (slot.rowSpan ?? 1) * (slot.colSpan ?? 1);
}

export function isPriorityPhoto(photo: HeaderPhoto, photos: HeaderPhoto[]): boolean {
	const maxArea = Math.max(...photos.map(slotArea));
	if (slotArea(photo) < maxArea) return false;

	const largest = photos
		.filter((candidate) => slotArea(candidate) === maxArea)
		.sort((a, b) => a.row - b.row || a.col - b.col);

	return largest[0]?.src === photo.src;
}
