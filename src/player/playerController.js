import { PLAYER_CONFIG } from '../config.js';

const GROUND_TOLERANCE = 0.08;
const SPAWN_CLEARANCE = 0.002;

export class PlayerController {
	constructor(scene, canvas, input, world) {
		this.scene = scene;
		this.canvas = canvas;
		this.input = input;
		this.world = world;
		this.verticalVelocity = 0;
		this.grounded = false;
		this.sneaking = false;
		this.currentHeight = PLAYER_CONFIG.HEIGHT;

		this.body = BABYLON.MeshBuilder.CreateBox('player-collider', { size: 0.1 }, scene);
		this.body.isVisible = false;
		this.body.isPickable = false;
		this.body.checkCollisions = true;
		this.body.ellipsoid = new BABYLON.Vector3(
			PLAYER_CONFIG.WIDTH / 2,
			PLAYER_CONFIG.HEIGHT / 2,
			PLAYER_CONFIG.WIDTH / 2
		);
		this.body.ellipsoidOffset = BABYLON.Vector3.Zero();

		this.camera = new BABYLON.UniversalCamera('player-camera', BABYLON.Vector3.Zero(), scene);
		this.camera.minZ = 0.03;
		this.camera.fov = 1.18;
		this.camera.inertia = 0.18;
		this.camera.angularSensibility = 2100;
		this.camera.attachControl(canvas, true);
		this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
		this.camera.inputs.removeByType('FreeCameraTouchInput');
		this.scene.activeCamera = this.camera;
	}

	spawnAtFeet(x, feetY, z) {
		this.verticalVelocity = 0;
		this.grounded = true;
		this.currentHeight = PLAYER_CONFIG.HEIGHT;
		this.body.ellipsoid.y = this.currentHeight / 2;
		this.body.position.set(x, feetY + this.currentHeight / 2, z);
		this.syncCamera();
	}

	spawnOnSurface(x, z) {
		const surfaceY = this.world.getSurfaceYAt(x, z);
		if (surfaceY === null) {
			this.spawnAtFeet(x, 16, z);
			this.grounded = false;
			return false;
		}
		this.spawnAtFeet(x, surfaceY + SPAWN_CLEARANCE, z);
		return true;
	}

	update(dt) {
		const wasSneaking = this.sneaking;
		this.sneaking = this.input.down('ShiftLeft', 'ShiftRight');
		const sprinting = this.input.down('ControlLeft', 'ControlRight') && !this.sneaking;
		const newHeight = this.sneaking ? PLAYER_CONFIG.SNEAK_HEIGHT : PLAYER_CONFIG.HEIGHT;

		if (newHeight !== this.currentHeight) {
			const feetY = this.getFeetY();
			this.currentHeight = newHeight;
			this.body.ellipsoid.y = newHeight / 2;
			this.body.position.y = feetY + newHeight / 2;
		}

		let forwardInput = 0;
		let sideInput = 0;
		if (this.input.down('KeyW', 'ArrowUp')) forwardInput += 1;
		if (this.input.down('KeyS', 'ArrowDown')) forwardInput -= 1;
		if (this.input.down('KeyD', 'ArrowRight')) sideInput += 1;
		if (this.input.down('KeyA', 'ArrowLeft')) sideInput -= 1;

		const inputLength = Math.hypot(forwardInput, sideInput);
		if (inputLength > 1) {
			forwardInput /= inputLength;
			sideInput /= inputLength;
		}

		const yaw = this.camera.rotation.y;
		const forward = new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
		const right = new BABYLON.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
		const direction = forward.scale(forwardInput).add(right.scale(sideInput));

		const speed = this.sneaking
			? PLAYER_CONFIG.SNEAK_SPEED
			: sprinting
				? PLAYER_CONFIG.SPRINT_SPEED
				: PLAYER_CONFIG.WALK_SPEED;

		this.refreshGroundedState();

		if (this.grounded && this.input.consume('Space')) {
			this.verticalVelocity = PLAYER_CONFIG.JUMP_VELOCITY;
			this.grounded = false;
		}

		if (!this.grounded) {
			this.verticalVelocity -= PLAYER_CONFIG.GRAVITY * dt;
		} else {
			this.verticalVelocity = 0;
		}

		const displacement = direction.scale(speed * dt);
		displacement.y = this.grounded ? 0 : this.verticalVelocity * dt;

		const beforeY = this.body.position.y;
		this.body.moveWithCollisions(displacement);
		const movedY = this.body.position.y - beforeY;

		if (!this.grounded && displacement.y < 0 && Math.abs(movedY - displacement.y) > 0.001) {
			this.verticalVelocity = 0;
		}

		this.refreshGroundedState(true);
		this.syncCamera();
	}

	refreshGroundedState(snap = false) {
		const surfaceY = this.world.getSurfaceYAt(this.body.position.x, this.body.position.z, Math.ceil(this.body.position.y + 2));
		if (surfaceY === null) {
			this.grounded = false;
			return;
		}

		const feetY = this.getFeetY();
		const distance = feetY - surfaceY;
		const canStand = this.verticalVelocity <= 0 && distance >= -GROUND_TOLERANCE && distance <= GROUND_TOLERANCE;
		this.grounded = canStand;

		if (canStand && snap) {
			this.body.position.y = surfaceY + this.currentHeight / 2;
			this.verticalVelocity = 0;
		}
	}

	getFeetY() {
		return this.body.position.y - this.currentHeight / 2;
	}

	syncCamera() {
		const eyeLevel = this.sneaking ? PLAYER_CONFIG.SNEAK_EYE_LEVEL : PLAYER_CONFIG.EYE_LEVEL;
		this.camera.position.copyFrom(this.body.position);
		this.camera.position.y = this.getFeetY() + eyeLevel;
	}

	pickTarget() {
		const ray = this.camera.getForwardRay(PLAYER_CONFIG.MAX_REACH);
		return this.scene.pickWithRay(ray, mesh => Boolean(mesh.metadata?.isVoxelChunk));
	}

	getPosition() {
		return this.body.position;
	}
}
