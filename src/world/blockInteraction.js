import { BLOCKS, getBlockDefinition } from './blockRegistry.js';

const SELECTABLE_BLOCKS = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.DIRT_STONE_MIX, BLOCKS.STONE];
const BREAK_SECONDS = 0.45;
const PLACE_REPEAT_SECONDS = 0.14;
const PLACE_RETRY_SECONDS = 0.04;

export class BlockInteraction {
	constructor(canvas, player, world, hotbar, selectedBlockName) {
		this.canvas = canvas;
		this.player = player;
		this.world = world;
		this.hotbar = hotbar;
		this.selectedBlockName = selectedBlockName;
		this.selectedIndex = 0;
		this.slots = [...hotbar.querySelectorAll('.hotbar-slot')];
		this.breakHeld = false;
		this.placeHeld = false;
		this.breakProgress = 0;
		this.breakCellKey = null;
		this.placeCooldown = 0;

		this.breakIndicator = BABYLON.MeshBuilder.CreateBox('break-progress-box', { size: 1.015 }, world.scene);
		const breakMaterial = new BABYLON.StandardMaterial('break-progress-material', world.scene);
		breakMaterial.wireframe = true;
		breakMaterial.disableLighting = true;
		breakMaterial.emissiveColor = new BABYLON.Color3(0.08, 0.08, 0.08);
		breakMaterial.alpha = 0.25;
		this.breakIndicator.material = breakMaterial;
		this.breakIndicator.isPickable = false;
		this.breakIndicator.checkCollisions = false;
		this.breakIndicator.isVisible = false;

		this.onContextMenuBound = event => event.preventDefault();
		this.onWheelBound = event => this.onWheel(event);
		this.onMouseDownBound = event => this.onMouseDown(event);
		this.onMouseUpBound = event => this.onMouseUp(event);
		this.onKeyDownBound = event => this.onKeyDown(event);
		this.onBlurBound = () => this.releaseActions();
		this.onPointerLockBound = () => {
			if (document.pointerLockElement !== this.canvas) this.releaseActions();
		};

		canvas.addEventListener('contextmenu', this.onContextMenuBound);
		canvas.addEventListener('wheel', this.onWheelBound, { passive: false });
		canvas.addEventListener('mousedown', this.onMouseDownBound);
		window.addEventListener('mouseup', this.onMouseUpBound);
		window.addEventListener('keydown', this.onKeyDownBound);
		window.addEventListener('blur', this.onBlurBound);
		document.addEventListener('pointerlockchange', this.onPointerLockBound);
		this.renderSelection();
	}

	dispose() {
		this.canvas.removeEventListener('contextmenu', this.onContextMenuBound);
		this.canvas.removeEventListener('wheel', this.onWheelBound);
		this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
		window.removeEventListener('mouseup', this.onMouseUpBound);
		window.removeEventListener('keydown', this.onKeyDownBound);
		window.removeEventListener('blur', this.onBlurBound);
		document.removeEventListener('pointerlockchange', this.onPointerLockBound);
		this.breakIndicator.material?.dispose?.();
		this.breakIndicator.dispose();
	}

	releaseActions() {
		this.breakHeld = false;
		this.placeHeld = false;
		this.resetBreakProgress();
		this.placeCooldown = 0;
	}

	onKeyDown(event) {
		if (event.code === 'Digit1') this.selectIndex(0);
		if (event.code === 'Digit2') this.selectIndex(1);
		if (event.code === 'Digit3') this.selectIndex(2);
		if (event.code === 'Digit4') this.selectIndex(3);
	}

	onWheel(event) {
		if (document.pointerLockElement !== this.canvas) return;
		event.preventDefault();
		const direction = event.deltaY > 0 ? 1 : -1;
		this.selectIndex((this.selectedIndex + direction + SELECTABLE_BLOCKS.length) % SELECTABLE_BLOCKS.length);
	}

	onMouseDown(event) {
		if (document.pointerLockElement !== this.canvas) return;
		if (event.button === 0) {
			this.breakHeld = true;
			this.resetBreakProgress();
		}
		if (event.button === 2) {
			this.placeHeld = true;
			this.placeCooldown = 0;
		}
	}

	onMouseUp(event) {
		if (event.button === 0) {
			this.breakHeld = false;
			this.resetBreakProgress();
		}
		if (event.button === 2) {
			this.placeHeld = false;
			this.placeCooldown = 0;
		}
	}

	update(dt) {
		if (document.pointerLockElement !== this.canvas) {
			this.breakIndicator.isVisible = false;
			return;
		}
		this.updateBreaking(dt);
		this.updatePlacing(dt);
	}

	updateBreaking(dt) {
		if (!this.breakHeld) {
			this.breakIndicator.isVisible = false;
			return;
		}

		const cells = this.getTargetCells();
		if (!cells) {
			this.resetBreakProgress();
			return;
		}

		const { x, y, z } = cells.breakCell;
		if (this.world.getBlock(x, y, z) === BLOCKS.AIR) {
			this.resetBreakProgress();
			return;
		}

		const key = `${x},${y},${z}`;
		if (key !== this.breakCellKey) {
			this.breakCellKey = key;
			this.breakProgress = 0;
		}

		this.breakProgress += dt;
		const progress = Math.min(1, this.breakProgress / BREAK_SECONDS);
		this.breakIndicator.position.set(x + 0.5, y + 0.5, z + 0.5);
		const pulse = 1.015 + Math.sin(progress * Math.PI * 6) * 0.008;
		this.breakIndicator.scaling.setAll(pulse);
		this.breakIndicator.material.alpha = 0.2 + progress * 0.55;
		this.breakIndicator.isVisible = true;

		if (this.breakProgress >= BREAK_SECONDS) {
			this.world.setBlockAndRebuild(x, y, z, BLOCKS.AIR);
			this.breakCellKey = null;
			this.breakProgress = 0;
			this.breakIndicator.isVisible = false;
		}
	}

	updatePlacing(dt) {
		if (!this.placeHeld) return;
		this.placeCooldown -= dt;
		if (this.placeCooldown > 0) return;
		const placed = this.placeTarget();
		this.placeCooldown = placed ? PLACE_REPEAT_SECONDS : PLACE_RETRY_SECONDS;
	}

	resetBreakProgress() {
		this.breakProgress = 0;
		this.breakCellKey = null;
		this.breakIndicator.isVisible = false;
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

	placeTarget() {
		const cells = this.getTargetCells();
		if (!cells) return false;
		const { x, y, z } = cells.placeCell;
		if (this.world.getBlock(x, y, z) !== BLOCKS.AIR) return false;
		if (this.player.intersectsBlock(x, y, z)) return false;
		return this.world.setBlockAndRebuild(x, y, z, SELECTABLE_BLOCKS[this.selectedIndex]);
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
