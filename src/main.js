import { WORLD_CONFIG, PLAYER_CONFIG, RENDER_CONFIG } from './config.js';
import { InputState } from './input/input.js';
import { getBlockDefinition, getBlockMaterial } from './world/blockRegistry.js?v=real-lighting-1';
import { VoxelWorld } from './world/world.js?v=real-lighting-1';
import { WorldManager } from './world/worldManager.js';
import { BlockInteraction } from './world/blockInteraction.js?v=hold-actions-1';
import { DayNightCycle } from './world/dayNightCycle.js?v=real-lighting-1';
import { PlayerController } from './player/playerController.js';
import { HealthSystem } from './player/healthSystem.js';
import { TitleScreen } from './ui/titleScreen.js';

const canvas = document.querySelector('#renderCanvas');
const titleRoot = document.querySelector('#titleScreen');
const worldList = document.querySelector('#worldList');
const emptyWorlds = document.querySelector('#emptyWorlds');
const newWorldButton = document.querySelector('#newWorldButton');
const createWorldPanel = document.querySelector('#createWorldPanel');
const worldNameInput = document.querySelector('#worldNameInput');
const seedInput = document.querySelector('#seedInput');
const randomSeedButton = document.querySelector('#randomSeedButton');
const confirmCreateWorld = document.querySelector('#confirmCreateWorld');
const cancelCreateWorld = document.querySelector('#cancelCreateWorld');
const boot = document.querySelector('#boot');
const bootStatus = document.querySelector('#bootStatus');
const playButton = document.querySelector('#playButton');
const mainMenuButton = document.querySelector('#mainMenuButton');
const hud = document.querySelector('#hud');
const healthBar = document.querySelector('#healthBar');
const damageFlash = document.querySelector('#damageFlash');
const suffocationShade = document.querySelector('#suffocationShade');
const hotbar = document.querySelector('#hotbar');
const selectedBlockName = document.querySelector('#selectedBlockName');
const devLeft = document.querySelector('#devLeft');
const debug = document.querySelector('#debug');
const target = document.querySelector('#target');

if (!window.BABYLON) throw new Error('Babylon.js is unavailable.');

const engine = new BABYLON.Engine(canvas, true, {
	preserveDrawingBuffer: false,
	stencil: true,
	disableWebGL2Support: false
});
engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

const scene = new BABYLON.Scene(engine);
scene.collisionsEnabled = true;
scene.clearColor = new BABYLON.Color4(...RENDER_CONFIG.CLEAR_COLOR);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
scene.fogDensity = RENDER_CONFIG.FOG_DENSITY;
scene.fogColor = new BABYLON.Color3(...RENDER_CONFIG.FOG_COLOR);
scene.ambientColor = BABYLON.Color3.Black();

const standbyCamera = new BABYLON.FreeCamera('standby-camera', new BABYLON.Vector3(0, 14, -18), scene);
standbyCamera.setTarget(new BABYLON.Vector3(0, 4, 0));
scene.activeCamera = standbyCamera;

const dayNight = new DayNightCycle(scene);
const input = new InputState();
const worldManager = new WorldManager();

let activeWorldRecord = null;
let world = null;
let player = null;
let health = null;
let blockInteraction = null;
let devOverlayVisible = false;
let debugTimer = 0;

const suffocationShell = BABYLON.MeshBuilder.CreateBox('suffocation-shell', {
	size: 0.998,
	sideOrientation: BABYLON.Mesh.BACKSIDE
}, scene);
suffocationShell.isVisible = false;
suffocationShell.isPickable = false;
suffocationShell.checkCollisions = false;

function resetWorldVisualState() {
	suffocationShell.isVisible = false;
	suffocationShade.classList.remove('active');
	dayNight.setOccluded(false);
}

function clearExistingWorld() {
	blockInteraction?.dispose?.();
	for (const mesh of [...scene.meshes]) {
		if (!mesh.metadata?.isVoxelChunk) continue;
		dayNight.shadowGenerator?.removeShadowCaster?.(mesh, false);
		mesh.dispose(false, false);
	}
	player?.body?.dispose?.();
	player?.camera?.dispose?.();
	resetWorldVisualState();
	scene.activeCamera = standbyCamera;
	world = null;
	player = null;
	health = null;
	blockInteraction = null;
	healthBar.textContent = '';
}

function lockPointer() {
	if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
}

function startWorld(record) {
	clearExistingWorld();
	activeWorldRecord = worldManager.get(record.id) ?? record;
	worldManager.touch(activeWorldRecord.id);

	world = new VoxelWorld(scene, {
		seed: activeWorldRecord.seed,
		savedBlocks: activeWorldRecord.blocks,
		onBlockEdit: blocks => worldManager.saveBlocks(activeWorldRecord.id, blocks)
	});
	world.createStarterWorld();

	player = new PlayerController(scene, canvas, input, world);
	player.camera.fov = RENDER_CONFIG.CAMERA_FOV;
	player.camera.minZ = RENDER_CONFIG.CAMERA_MIN_Z;
	player.spawnOnSurface(0.5, 0.5);

	health = new HealthSystem(player, healthBar, damageFlash);
	blockInteraction = new BlockInteraction(canvas, player, world, hotbar, selectedBlockName);
	dayNight.reset();
	dayNight.update(0, player.getPosition());

	titleScreen.hide();
	boot.classList.add('hidden');
	hud.classList.remove('hidden');
	const stats = world.getChunkStats();
	bootStatus.textContent = `${activeWorldRecord.name} · SEED ${activeWorldRecord.seed} · ${stats.faces.toLocaleString()} FACES`;
	playButton.textContent = 'RETURN TO WORLD';
	lockPointer();
}

const titleScreen = new TitleScreen(worldManager, {
	root: titleRoot,
	worldList,
	emptyState: emptyWorlds,
	newWorldButton,
	createPanel: createWorldPanel,
	worldNameInput,
	seedInput,
	seedRandomButton: randomSeedButton,
	createButton: confirmCreateWorld,
	cancelCreateButton: cancelCreateWorld
}, {
	onPlay: startWorld
});

function returnToMainMenu() {
	if (document.pointerLockElement) document.exitPointerLock?.();
	clearExistingWorld();
	activeWorldRecord = null;
	boot.classList.add('hidden');
	hud.classList.add('hidden');
	titleScreen.show();
}

function setDevOverlayVisible(visible) {
	devOverlayVisible = visible;
	devLeft.classList.toggle('hidden', !visible);
	debug.classList.toggle('hidden', !visible);
}

setDevOverlayVisible(false);

function handleDevToggle(event) {
	const isF3 = event.code === 'F3' || event.key === 'F3' || event.keyCode === 114;
	const isFallback = event.code === 'Backquote';
	if (!isF3 && !isFallback) return;
	event.preventDefault();
	event.stopPropagation();
	setDevOverlayVisible(!devOverlayVisible);
}

window.addEventListener('keydown', handleDevToggle, true);

playButton.addEventListener('click', () => {
	if (!player) return;
	boot.classList.add('hidden');
	lockPointer();
});

mainMenuButton.addEventListener('click', returnToMainMenu);

canvas.addEventListener('click', () => {
	if (player && boot.classList.contains('hidden') && titleRoot.classList.contains('hidden')) lockPointer();
});

document.addEventListener('pointerlockchange', () => {
	if (document.pointerLockElement === canvas) {
		boot.classList.add('hidden');
		return;
	}
	if (!player || !titleRoot.classList.contains('hidden')) return;
	boot.classList.remove('hidden');
	bootStatus.textContent = `${activeWorldRecord?.name ?? 'WORLD'} · SEED ${activeWorldRecord?.seed ?? 0}`;
	playButton.textContent = 'RETURN TO WORLD';
});

function updateTarget() {
	if (!player || !world) return;
	const hit = player.pickTarget();
	if (!hit?.hit || !hit.pickedPoint || !hit.getNormal) {
		target.textContent = 'AIR';
		return;
	}
	const normal = hit.getNormal(true) ?? BABYLON.Vector3.Zero();
	const insidePoint = hit.pickedPoint.subtract(normal.scale(0.001));
	const x = Math.floor(insidePoint.x);
	const y = Math.floor(insidePoint.y);
	const z = Math.floor(insidePoint.z);
	const blockId = world.getBlock(x, y, z);
	const definition = getBlockDefinition(blockId);
	target.textContent = definition ? `${definition.name.toUpperCase()} · ${x}, ${y}, ${z}` : 'AIR';
}

function updateSuffocationVisual() {
	if (!player) return;
	const block = player.getSuffocationBlock();
	const suffocating = block !== null;
	suffocationShade.classList.toggle('active', suffocating);
	dayNight.setOccluded(suffocating);

	if (suffocating && block) {
		suffocationShell.position.set(block.x + 0.5, block.y + 0.5, block.z + 0.5);
		suffocationShell.material = getBlockMaterial(scene, block.id);
		suffocationShell.isVisible = true;
	} else {
		suffocationShell.isVisible = false;
	}
}

function updateDebug(dt) {
	if (!devOverlayVisible || !player || !world || !health || !blockInteraction) return;
	debugTimer += dt;
	if (debugTimer < 0.12) return;
	debugTimer = 0;
	const position = player.getPosition();
	const chunkStats = world.getChunkStats();
	const selected = getBlockDefinition(blockInteraction.getSelectedBlockId());
	const cycle = dayNight.getState();
	debug.textContent = [
		`${engine.getFps().toFixed(0)} FPS`,
		`WORLD ${activeWorldRecord?.name ?? 'UNKNOWN'}`,
		`SEED ${world.seed}`,
		`SKY ${cycle.label} ${(cycle.progress * 100).toFixed(1)}%`,
		`XYZ ${position.x.toFixed(3)} / ${position.y.toFixed(3)} / ${position.z.toFixed(3)}`,
		`SPRINT ${player.sprinting ? 'ON' : 'OFF'}`,
		`PLAYER ${PLAYER_CONFIG.WIDTH.toFixed(1)}m × ${PLAYER_CONFIG.HEIGHT.toFixed(1)}m`,
		`EYE ${player.sneaking ? PLAYER_CONFIG.SNEAK_EYE_LEVEL : PLAYER_CONFIG.EYE_LEVEL}m`,
		`HEALTH ${health.health.toFixed(1)} / ${health.maxHealth}`,
		`SELECTED ${selected?.name ?? 'Unknown'}`,
		`REACH ${PLAYER_CONFIG.MAX_REACH.toFixed(1)}m`,
		`CHUNKS ${chunkStats.chunks} · FACES ${chunkStats.faces}`
	].join('\n');
}

let lastTime = performance.now();
engine.runRenderLoop(() => {
	const now = performance.now();
	const dt = Math.min((now - lastTime) / 1000, 0.05);
	lastTime = now;

	if (player && document.pointerLockElement === canvas) {
		player.update(dt);
		blockInteraction?.update(dt);
		health.update(dt);
		updateSuffocationVisual();
		dayNight.update(dt, player.getPosition());
		updateTarget();
		updateDebug(dt);
	}

	input.endFrame();
	scene.render();
});

window.addEventListener('resize', () => engine.resize());

console.info('[IFT] world manager loaded', {
	blockSize: WORLD_CONFIG.BLOCK_SIZE,
	chunkSize: [WORLD_CONFIG.CHUNK_SIZE_X, WORLD_CONFIG.CHUNK_SIZE_Y, WORLD_CONFIG.CHUNK_SIZE_Z],
	worldCount: worldManager.list().length
});
