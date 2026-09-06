import { PLAYER_CONFIG } from '../config.js';

const GROUND_PROBE_START = 0.12;
const GROUND_PROBE_LENGTH = 0.22;
const SPAWN_CLEARANCE = 0.03;

export class PlayerController {
	constructor(scene, canvas, input) {
		this.scene = scene;
		this.canvas = canvas;
		this.input = input;
		this.verticalVelocity = 0;
		this.grounded = false;
		this.sneaking = false;

		this.body = BABYLON.MeshBuilder.CreateBox('player-collider', { size: 0.1 }, scene);
		this.body.isVisible = false;
		this.body.isPickable = false;
		this.body.checkCollisions = true;
		this.body.ellipsoid = new BABYLON.Vector3(
			PLAYER_CONFIG.WIDTH / 2,
			PLAYER_CONFIG.HEIGHT / 2,
			PLAYER_CONFIG.WIDTH / 2
		);
		this.body.ellipsoidOffset = new BABYLON.Vector3(0, PLAYER_CONFIG.HEIGHT / 2, 0);

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

	spawn(x, y, z) {
		this.verticalVelocity = 0;
		this.grounded = false;
		this.body.position.set(x, y, z);
		this.camera.position.set(x, y + PLAYER_CONFIG.EYE_LEVEL, z);
	}

	spawnOnSurface(x, z, castFromY = 64) {
		const ray = new BABYLON.Ray(
			new BABYLON.Vector3(x, castFromY, z),
			BABYLON.Vector3.Down(),
			castFromY + 128
		);
		const hit = this.scene.pickWithRay(ray, mesh => Boolean(mesh.metadata?.isVoxelChunk));
		if (!hit?.hit || !hit.pickedPoint) {
			this.spawn(x, castFromY, z);
			return false;
		}

		this.spawn(x, hit.pickedPoint.y + SPAWN_CLEARANCE, z);
		return true;
	}

	update(dt) {
		this.sneaking = this.input.down('ShiftLeft', 'ShiftRight');
		const sprinting = this.input.down('ControlLeft', 'ControlRight') && !this.sneaking;

		const height = this.sneaking ? PLAYER_CONFIG.SNEAK_HEIGHT : PLAYER_CONFIG.HEIGHT;
		const eyeLevel = this.sneaking ? PLAYER_CONFIG.SNEAK_EYE_LEVEL : PLAYER_CONFIG.EYE_LEVEL;
		this.body.ellipsoid.y = height / 2;
		this.body.ellipsoidOffset.y = height / 2;

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

		this.grounded = this.checkGrounded();

		if (this.grounded) {
			if (this.verticalVelocity < 0) this.verticalVelocity = 0;
			if (this.input.consume('Space')) {
				this.verticalVelocity = PLAYER_CONFIG.JUMP_VELOCITY;
				this.grounded = false;
			}
		}

		if (!this.grounded) {
			this.verticalVelocity -= PLAYER_CONFIG.GRAVITY * dt;
		}

		const displacement = direction.scale(speed * dt);
		displacement.y = this.grounded ? 0 : this.verticalVelocity * dt;

		const beforeY = this.body.position.y;
		this.body.moveWithCollisions(displacement);
		const actualY = this.body.position.y - beforeY;

		if (!this.grounded && displacement.y !== 0 && Math.abs(actualY - displacement.y) > 0.001) {
			this.verticalVelocity = 0;
			if (displacement.y < 0) this.grounded = true;
		}

		this.camera.position.copyFrom(this.body.position);
		this.camera.position.y += eyeLevel;
	}

	checkGrounded() {
		const origin = this.body.position.add(new BABYLON.Vector3(0, GROUND_PROBE_START, 0));
		const ray = new BABYLON.Ray(origin, BABYLON.Vector3.Down(), GROUND_PROBE_LENGTH);
		const hit = this.scene.pickWithRay(ray, mesh => Boolean(mesh.metadata?.isVoxelChunk));
		return Boolean(hit?.hit);
	}

	pickTarget() {
		const ray = this.camera.getForwardRay(PLAYER_CONFIG.MAX_REACH);
		return this.scene.pickWithRay(ray, mesh => Boolean(mesh.metadata?.isVoxelChunk));
	}

	getPosition() {
		return this.body.position;
	}
}
