import { WORLD_CONFIG, PLAYER_CONFIG, RENDER_CONFIG } from './config.js';
import { InputState } from './input/input.js';
import { getBlockDefinition, getBlockMaterial } from './world/blockRegistry.js';
import { VoxelWorld } from './world/world.js';
import { BlockInteraction } from './world/blockInteraction.js';
import { PlayerController } from './player/playerController.js';
import { HealthSystem } from './player/healthSystem.js';

const canvas = document.querySelector('#renderCanvas');
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

if (!window.BABYLON) {
	bootStatus.textContent = 'Babylon.js failed to load.';
	throw new Error('Babylon.js is unavailable.');
}

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
const world = new VoxelWorld(scene);
bootStatus.textContent = 'Generating 16×16×16 voxel chunks…';
world.createStarterWorld();

const player = new PlayerController(scene, canvas, input, world);
player.camera.fov = RENDER_CONFIG.CAMERA_FOV;
player.camera.minZ = RENDER_CONFIG.CAMERA_MIN_Z;
player.spawnOnSurface(0.5, 0.5);

const health = new HealthSystem(player, healthBar, damageFlash);
const blockInteraction = new BlockInteraction(canvas, player, world, hotbar, selectedBlockName);

const suffocationShell = BABYLON.MeshBuilder.CreateBox('suffocation-shell', {
	size: 0.998,
	sideOrientation: BABYLON.Mesh.BACKSIDE
}, scene);
suffocationShell.isVisible = false;
suffocationShell.isPickable = false;
suffocationShell.checkCollisions = false;

const stats = world.getChunkStats();
bootStatus.textContent = `${stats.chunks} chunks ready · ${stats.faces.toLocaleString()} exposed faces`;

let devOverlayVisible = false;
let suffocatingLastFrame = false;

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

function lockPointer() {
	if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
}

playButton.addEventListener('click', () => {
	boot.classList.add('hidden');
	hud.classList.remove('hidden');
	lockPointer();
});

canvas.addEventListener('click', () => {
	if (boot.classList.contains('hidden')) lockPointer();
});

document.addEventListener('pointerlockchange', () => {
	if (document.pointerLockElement === canvas) return;
	if (!boot.classList.contains('hidden')) return;
	boot.classList.remove('hidden');
	bootStatus.textContent = 'Paused · click ENTER WORLD to recapture the mouse';
	playButton.textContent = 'RETURN TO WORLD';
});

let lastTime = performance.now();
let debugTimer = 0;

function updateTarget() {
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

	if (suffocating !== suffocatingLastFrame) {
		suffocatingLastFrame = suffocating;
	}
}

function updateDebug(dt) {
	if (!devOverlayVisible) return;

	debugTimer += dt;
	if (debugTimer < 0.12) return;
	debugTimer = 0;

	const position = player.getPosition();
	const chunkStats = world.getChunkStats();
	const selected = getBlockDefinition(blockInteraction.getSelectedBlockId());
	debug.textContent = [
		`${engine.getFps().toFixed(0)} FPS`,
		`XYZ ${position.x.toFixed(3)} / ${position.y.toFixed(3)} / ${position.z.toFixed(3)}`,
		`PLAYER ${PLAYER_CONFIG.WIDTH.toFixed(1)}m × ${PLAYER_CONFIG.HEIGHT.toFixed(1)}m`,
		`EYE ${player.sneaking ? PLAYER_CONFIG.SNEAK_EYE_LEVEL : PLAYER_CONFIG.EYE_LEVEL}m`,
		`HEALTH ${health.health.toFixed(1)} / ${health.maxHealth}`,
		`SELECTED ${selected?.name ?? 'Unknown'}`,
		`REACH ${PLAYER_CONFIG.MAX_REACH.toFixed(1)}m`,
		`CHUNKS ${chunkStats.chunks} · FACES ${chunkStats.faces}`
	].join('\n');
}

engine.runRenderLoop(() => {
	const now = performance.now();
	const dt = Math.min((now - lastTime) / 1000, 0.05);
	lastTime = now;

	if (document.pointerLockElement === canvas) {
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

console.info('[IFT] 3D voxel prototype loaded', {
	blockSize: WORLD_CONFIG.BLOCK_SIZE,
	chunkSize: [WORLD_CONFIG.CHUNK_SIZE_X, WORLD_CONFIG.CHUNK_SIZE_Y, WORLD_CONFIG.CHUNK_SIZE_Z],
	walkSpeed: PLAYER_CONFIG.WALK_SPEED,
	sprintSpeed: PLAYER_CONFIG.SPRINT_SPEED,
	reach: PLAYER_CONFIG.MAX_REACH
});
