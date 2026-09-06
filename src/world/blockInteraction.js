import { BLOCKS, getBlockDefinition } from './blockRegistry.js';

const SELECTABLE_BLOCKS = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE];

export class BlockInteraction {
	constructor(canvas, player, world, hotbar, selectedBlockName) {
		this.canvas = canvas;
		this.player = player;
		this.world = world;
		this.hotbar = hotbar;
		this.selectedBlockName = selectedBlockName;
		this.selectedIndex = 0;
		this.slots = [...hotbar.querySelectorAll('.hotbar-slot')];

		this.onContextMenuBound = event => event.preventDefault();
		this.onWheelBound = event => this.onWheel(event);
		this.onMouseDownBound = event => this.onMouseDown(event);
		this.onKeyDownBound = event => this.onKeyDown(event);

		canvas.addEventListener('contextmenu', this.onContextMenuBound);
		canvas.addEventListener('wheel', this.onWheelBound, { passive: false });
		canvas.addEventListener('mousedown', this.onMouseDownBound);
		window.addEventListener('keydown', this.onKeyDownBound);
		this.renderSelection();
	}

	dispose() {
		this.canvas.removeEventListener('contextmenu', this.onContextMenuBound);
		this.canvas.removeEventListener('wheel', this.onWheelBound);
		this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
		window.removeEventListener('keydown', this.onKeyDownBound);
	}

	onKeyDown(event) {
		if (event.code === 'Digit1') this.selectIndex(0);
		if (event.code === 'Digit2') this.selectIndex(1);
		if (event.code === 'Digit3') this.selectIndex(2);
	}

	onWheel(event) {
		if (document.pointerLockElement !== this.canvas) return;
		event.preventDefault();
		const direction = event.deltaY > 0 ? 1 : -1;
		this.selectIndex((this.selectedIndex + direction + SELECTABLE_BLOCKS.length) % SELECTABLE_BLOCKS.length);
	}

	onMouseDown(event) {
		if (document.pointerLockElement !== this.canvas) return;
		if (event.button === 0) this.breakTarget();
		if (event.button === 2) this.placeTarget();
	}

	selectIndex(index) {
		if (index < 0 || index >= SELECTABLE_BLOCKS.length) return;
		this.selectedIndex = index;
		this.renderSelection();
	}

	getTargetCells() {
		const hit = this.player.pickTarget();
		if (!hit?.hit || !hit.pickedPoint || !hit.getNormal) return null;
		const normal = hit.getNormal(true);
		if (!normal) return null;
		const inside = hit.pickedPoint.subtract(normal.scale(0.001));
		const outside = hit.pickedPoint.add(normal.scale(0.001));
		return {
			breakCell: { x: Math.floor(inside.x), y: Math.floor(inside.y), z: Math.floor(inside.z) },
			placeCell: { x: Math.floor(outside.x), y: Math.floor(outside.y), z: Math.floor(outside.z) }
		};
	}

	breakTarget() {
		const cells = this.getTargetCells();
		if (!cells) return;
		const { x, y, z } = cells.breakCell;
		if (this.world.getBlock(x, y, z) === BLOCKS.AIR) return;
		this.world.setBlockAndRebuild(x, y, z, BLOCKS.AIR);
	}

	placeTarget() {
		const cells = this.getTargetCells();
		if (!cells) return;
		const { x, y, z } = cells.placeCell;
		if (this.world.getBlock(x, y, z) !== BLOCKS.AIR) return;
		if (this.player.intersectsBlock(x, y, z)) return;
		this.world.setBlockAndRebuild(x, y, z, SELECTABLE_BLOCKS[this.selectedIndex]);
	}

	renderSelection() {
		const selectedId = SELECTABLE_BLOCKS[this.selectedIndex];
		for (const slot of this.slots) {
			slot.classList.toggle('selected', Number(slot.dataset.blockId) === selectedId);
		}
		const definition = getBlockDefinition(selectedId);
		this.selectedBlockName.textContent = definition?.name ?? 'Unknown Block';
	}

	getSelectedBlockId() {
		return SELECTABLE_BLOCKS[this.selectedIndex];
	}
}
