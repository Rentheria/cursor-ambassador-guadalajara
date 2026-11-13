import { desktopBentoGrid, desktopBentoSlots, mobileBentoGrid } from '../content/bento-slots';
import { headerPhotoPool } from '../content/header-photos';
import { BentoSlot } from '../lib/types';

type GridConfig = { cols: number; rows: number };

function occupySlot(bitmap: boolean[][], slot: BentoSlot, grid: GridConfig, label: string) {
	const rowSpan = slot.rowSpan ?? 1;
	const colSpan = slot.colSpan ?? 1;

	for (let row = slot.row; row < slot.row + rowSpan; row += 1) {
		for (let col = slot.col; col < slot.col + colSpan; col += 1) {
			if (row < 1 || col < 1 || row > grid.rows || col > grid.cols) {
				throw new Error(`${label}: slot out of bounds at row ${row}, col ${col}`);
			}

			if (bitmap[row - 1][col - 1]) {
				throw new Error(`${label}: overlapping cells at row ${row}, col ${col}`);
			}

			bitmap[row - 1][col - 1] = true;
		}
	}
}

function validateLayout(
	slots: BentoSlot[],
	grid: GridConfig,
	label: string,
	requireFullCover: boolean,
	breakpoint: 'desktop' | 'mobile',
) {
	const bitmap = Array.from({ length: grid.rows }, () => Array.from({ length: grid.cols }, () => false));

	for (const slot of slots) {
		if (breakpoint === 'mobile' && slot.mobileHidden) continue;
		const placement = breakpoint === 'mobile' ? (slot.mobile ?? slot) : slot;
		occupySlot(bitmap, placement, grid, label);
	}

	const filled = bitmap.flat().filter(Boolean).length;
	const total = grid.rows * grid.cols;

	if (requireFullCover && filled !== total) {
		throw new Error(`${label}: expected full ${total}-cell cover, got ${filled} cells`);
	}

	return { filled, total };
}

function main() {
	if (headerPhotoPool.length < desktopBentoSlots.length) {
		console.warn(
			`[validate-bento] Pool has ${headerPhotoPool.length} images for ${desktopBentoSlots.length} slots (repeat at runtime).`,
		);
	}

	validateLayout(desktopBentoSlots, desktopBentoGrid, 'desktop', true, 'desktop');

	const mobileVisible = desktopBentoSlots.filter((slot) => !slot.mobileHidden);
	validateLayout(mobileVisible, mobileBentoGrid, 'mobile', true, 'mobile');

	console.log('validate-bento: OK (desktop 16/16, mobile 8/8)');
}

main();
