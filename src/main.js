import { WORLD_CONFIG, PLAYER_CONFIG, RENDER_CONFIG } from './config.js';
import { InputState } from './input/input.js';
import { getBlockDefinition, getBlockMaterial } from './world/blockRegistry.js';
import { VoxelWorld } from './world/world.js';
import { WorldManager } from './world/worldManager.js';
import { BlockInteraction } from './world/blockInteraction.js';
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
scene.ambientColor = new BABYLON.Color3(0.35, 0.4, 0.46);

const hemisphericLight = new BABYLON.HemisphericLight('sky-light', new BABYLON.Vector3(0.25, 1, 0.15), scene);
hemisphericLight.intensity = 0.78;
hemisphericLight.diffuse = new BABYLON.Color3(0.72, 0.84, 1);
hemisphericLight.groundColor = new BABYLON.Color3(0.17, 0.2, 0.26);

const sunLight = new BABYLON.DirectionalLight('sun-light', new BABYLON.Vector3(-0.55, -1, 0.35), scene);
sunLight.intensity = 0.52;
sunLight.diffuse = new BABYLON.Color3(1, 0.9, 0.7);

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

function clearExistingWorld() {
	for (const mesh of [...scene.meshes]) {
		if (mesh.metadata?.isVoxelChunk) mesh.dispose(false, false);
	}
	player?.body?.dispose?.();
	player?.camera?.dispose?.();
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

	titleScreen.hide();
	boot.classList.add('hidden');
	hud.classList.remove('hidden');
	const stats = world.getChunkStats();
	bootStatus.textContent = `${activeWorldRecord.name} · seed ${activeWorldRecord.seed} · ${stats.faces.toLocaleString()} faces`;
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
	bootStatus.textContent = `${activeWorldRecord?.name ?? 'World'} · seed ${activeWorldRecord?.seed ?? 0}`;
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
	target.textContent = definition ? `${definition.name} · ${x}, ${y}, ${z}` : 'AIR';
}

function updateSuffocationVisual() {
	if (!player) return;
	const block = player.getSuffocationBlock();
	const suffocating = block !== null;
	suffocationShade.classList.toggle('active', suffocating);

	if (suffocating && block) {
		suffocationShell.position.set(block.x + 0.5, block.y + 0.5, block.z + 0.5);
		suffocationShell.material = getBlockMaterial(scene, block.id);
		suffocationShell.isVisible = true;
		hemisphericLight.intensity = 0.035;
		sunLight.intensity = 0;
		scene.ambientColor.set(0.025, 0.025, 0.025);
	} else {
		suffocationShell.isVisible = false;
		hemisphericLight.intensity = 0.78;
		sunLight.intensity = 0.52;
		scene.ambientColor.set(0.35, 0.4, 0.46);
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
	debug.textContent = [
		`${engine.getFps().toFixed(0)} FPS`,
		`WORLD ${activeWorldRecord?.name ?? 'Unknown'}`,
		`SEED ${world.seed}`,
		`XYZ ${position.x.toFixed(3)} / ${position.y.toFixed(3)} / ${position.z.toFixed(3)}`,
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
		health.update(dt);
		updateSuffocationVisual();
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
