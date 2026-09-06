import { PLAYER_CONFIG } from '../config.js';

const GROUND_TOLERANCE = 0.08;
const SPAWN_CLEARANCE = 0.002;
const EDGE_INSET = 0.05;
const CEILING_CLEARANCE = 0.002;

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
		this.lastForwardPressAt = -Infinity;
		this.doubleTapSprinting = false;

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
		this.sneaking = false;
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
		this.sneaking = this.input.down('ShiftLeft', 'ShiftRight');
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

		if (this.input.consume('KeyW')) {
			const now = performance.now();
			this.doubleTapSprinting = now - this.lastForwardPressAt <= PLAYER_CONFIG.DOUBLE_TAP_SPRINT_WINDOW_MS;
			this.lastForwardPressAt = now;
		}
		if (!this.input.down('KeyW')) this.doubleTapSprinting = false;

		const inputLength = Math.hypot(forwardInput, sideInput);
		if (inputLength > 1) {
			forwardInput /= inputLength;
			sideInput /= inputLength;
		}

		const controlSprinting = this.input.down('ControlLeft', 'ControlRight');
		const sprinting = !this.sneaking && forwardInput > 0 && (controlSprinting || this.doubleTapSprinting);

		const yaw = this.camera.rotation.y;
		const forward = new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
		const right = new BABYLON.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
		const direction = forward.scale(forwardInput).add(right.scale(sideInput));

		const speed = this.sneaking
			? PLAYER_CONFIG.SNEAK_SPEED
			: sprinting
				? PLAYER_CONFIG.SPRINT_SPEED
				: PLAYER_CONFIG.WALK_SPEED;

		this.refreshGroundedState(true);

		if (this.grounded && this.input.consume('Space')) {
			this.verticalVelocity = PLAYER_CONFIG.JUMP_VELOCITY;
			this.grounded = false;
		}

		const horizontal = direction.scale(speed * dt);
		if (this.sneaking && this.grounded) this.applySneakEdgeSafety(horizontal);
		this.body.moveWithCollisions(new BABYLON.Vector3(horizontal.x, 0, horizontal.z));

		this.applyVerticalMotion(dt);
		this.refreshGroundedState(true);
		this.syncCamera();
	}

	applyVerticalMotion(dt) {
		if (this.grounded) {
			this.verticalVelocity = 0;
			return;
		}

		this.verticalVelocity -= PLAYER_CONFIG.GRAVITY * dt;
		const deltaY = this.verticalVelocity * dt;
		if (deltaY === 0) return;

		const oldFeet = this.getFeetY();
		const oldHead = oldFeet + this.currentHeight;

		if (deltaY < 0) {
			const proposedFeet = oldFeet + deltaY;
			const surfaceY = this.world.getSurfaceYAt(
				this.body.position.x,
				this.body.position.z,
				Math.ceil(oldFeet + 0.25)
			);

			if (surfaceY !== null && oldFeet >= surfaceY - GROUND_TOLERANCE && proposedFeet <= surfaceY) {
				this.body.position.y = surfaceY + this.currentHeight / 2;
				this.verticalVelocity = 0;
				this.grounded = true;
				return;
			}
		} else {
			const proposedHead = oldHead + deltaY;
			const ceilingY = this.world.getCeilingBottomYAt(
				this.body.position.x,
				this.body.position.z,
				oldHead,
				proposedHead
			);

			if (ceilingY !== null && proposedHead >= ceilingY) {
				this.body.position.y = ceilingY - this.currentHeight / 2 - CEILING_CLEARANCE;
				this.verticalVelocity = 0;
				return;
			}
		}

		this.body.position.y += deltaY;
	}

	applySneakEdgeSafety(displacement) {
		if (displacement.x === 0 && displacement.z === 0) return;

		const currentX = this.body.position.x;
		const currentZ = this.body.position.z;
		const targetX = currentX + displacement.x;
		const targetZ = currentZ + displacement.z;

		if (this.hasSneakSupport(targetX, targetZ)) return;

		const canMoveX = displacement.x !== 0 && this.hasSneakSupport(targetX, currentZ);
		const canMoveZ = displacement.z !== 0 && this.hasSneakSupport(currentX, targetZ);

		if (!canMoveX) displacement.x = 0;
		if (!canMoveZ) displacement.z = 0;
	}

	hasSneakSupport(x, z) {
		const feetY = this.getFeetY();
		const radius = PLAYER_CONFIG.WIDTH / 2 - EDGE_INSET;
		const probes = [
			[x - radius, z - radius],
			[x + radius, z - radius],
			[x - radius, z + radius],
			[x + radius, z + radius]
		];
		return probes.every(([px, pz]) => this.world.hasSupportAt(px, pz, feetY, 0.14));
	}

	refreshGroundedState(snap = false) {
		if (this.verticalVelocity > 0) {
			this.grounded = false;
			return;
		}

		const surfaceY = this.world.getSurfaceYAt(
			this.body.position.x,
			this.body.position.z,
			Math.ceil(this.getFeetY() + 0.25)
		);
		if (surfaceY === null) {
			this.grounded = false;
			return;
		}

		const feetY = this.getFeetY();
		const distance = feetY - surfaceY;
		const canStand = distance >= -GROUND_TOLERANCE && distance <= GROUND_TOLERANCE;
		this.grounded = canStand;

		if (canStand && snap) {
			this.body.position.y = surfaceY + this.currentHeight / 2;
			this.verticalVelocity = 0;
		}
	}

	isSuffocating() {
		const feetY = this.getFeetY();
		const headY = feetY + this.currentHeight - 0.05;
		const radius = PLAYER_CONFIG.WIDTH / 2 - 0.04;
		const probes = [
			[this.body.position.x, this.body.position.z],
			[this.body.position.x - radius, this.body.position.z - radius],
			[this.body.position.x + radius, this.body.position.z - radius],
			[this.body.position.x - radius, this.body.position.z + radius],
			[this.body.position.x + radius, this.body.position.z + radius]
		];
		const blockY = Math.floor(headY);
		return probes.some(([x, z]) => this.world.isSolid(Math.floor(x), blockY, Math.floor(z)));
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
