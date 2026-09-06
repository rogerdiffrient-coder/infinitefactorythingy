import { PLAYER_CONFIG, RENDER_CONFIG } from '../config.js?v=bug-sweep-15';

const GROUND_TOLERANCE = 0.08;
const SPAWN_CLEARANCE = 0.002;
const EDGE_INSET = 0.05;
const CEILING_CLEARANCE = 0.002;
const COLLISION_SKIN = 0.001;

export class PlayerController {
	constructor(scene, canvas, input, world) {
		this.scene = scene;
		this.canvas = canvas;
		this.input = input;
		this.world = world;
		this.verticalVelocity = 0;
		this.grounded = false;
		this.sneaking = false;
		this.sprinting = false;
		this.currentHeight = PLAYER_CONFIG.HEIGHT;
		this.lastForwardPressAt = -Infinity;
		this.doubleTapSprinting = false;

		this.body = BABYLON.MeshBuilder.CreateBox('player-collider', { size: 0.1 }, scene);
		this.body.isVisible = false;
		this.body.isPickable = false;
		this.body.checkCollisions = false;
		this.body.ellipsoid = new BABYLON.Vector3(
			PLAYER_CONFIG.WIDTH / 2,
			PLAYER_CONFIG.HEIGHT / 2,
			PLAYER_CONFIG.WIDTH / 2
		);
		this.body.ellipsoidOffset = BABYLON.Vector3.Zero();

		this.camera = new BABYLON.UniversalCamera('player-camera', BABYLON.Vector3.Zero(), scene);
		this.camera.minZ = RENDER_CONFIG.CAMERA_MIN_Z;
		this.camera.fov = RENDER_CONFIG.CAMERA_FOV;
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
		this.sprinting = false;
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
		const sneakRequested = this.input.down('ShiftLeft', 'ShiftRight');
		const canStandUp = this.currentHeight >= PLAYER_CONFIG.HEIGHT || this.canOccupyHeight(PLAYER_CONFIG.HEIGHT);
		this.sneaking = sneakRequested || !canStandUp;
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

		const sprintRequested = this.input.controlDown() || this.doubleTapSprinting;
		this.sprinting = !this.sneaking && inputLength > 0 && sprintRequested;

		const yaw = this.camera.rotation.y;
		const forward = new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
		const right = new BABYLON.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
		const direction = forward.scale(forwardInput).add(right.scale(sideInput));

		const speed = this.sneaking
			? PLAYER_CONFIG.SNEAK_SPEED
			: this.sprinting
				? PLAYER_CONFIG.SPRINT_SPEED
				: PLAYER_CONFIG.WALK_SPEED;

		const targetFov = this.sprinting ? RENDER_CONFIG.CAMERA_FOV * 1.06 : RENDER_CONFIG.CAMERA_FOV;
		this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 14);

		this.refreshGroundedState(true);

		if (this.grounded && this.input.down('Space')) {
			this.verticalVelocity = PLAYER_CONFIG.JUMP_VELOCITY;
			this.grounded = false;
		}

		const horizontal = direction.scale(speed * dt);
		if (this.sneaking && this.grounded) this.applySneakEdgeSafety(horizontal);
		this.moveHorizontalWithVoxelCollision(horizontal.x, horizontal.z);

		this.applyVerticalMotion(dt);
		this.refreshGroundedState(true);
		this.syncCamera();
	}

	moveHorizontalWithVoxelCollision(deltaX, deltaZ) {
		if (deltaX !== 0) {
			const targetX = this.body.position.x + deltaX;
			if (!this.collidesWithWorld(targetX, this.body.position.z)) this.body.position.x = targetX;
		}
		if (deltaZ !== 0) {
			const targetZ = this.body.position.z + deltaZ;
			if (!this.collidesWithWorld(this.body.position.x, targetZ)) this.body.position.z = targetZ;
		}
	}

	collidesWithWorld(centerX, centerZ) {
		return this.collidesVolume(centerX, centerZ, this.currentHeight);
	}

	canOccupyHeight(height) {
		return !this.collidesVolume(this.body.position.x, this.body.position.z, height);
	}

	collidesVolume(centerX, centerZ, height) {
		const half = PLAYER_CONFIG.WIDTH / 2;
		const feetY = this.getFeetY();
		const headY = feetY + height;
		const minX = centerX - half + COLLISION_SKIN;
		const maxX = centerX + half - COLLISION_SKIN;
		const minY = feetY + COLLISION_SKIN;
		const maxY = headY - COLLISION_SKIN;
		const minZ = centerZ - half + COLLISION_SKIN;
		const maxZ = centerZ + half - COLLISION_SKIN;
		for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
			for (let z = Math.floor(minZ); z <= Math.floor(maxZ); z++) {
				for (let x = Math.floor(minX); x <= Math.floor(maxX); x++) {
					if (this.world.isSolid(x, y, z)) return true;
				}
			}
		}
		return false;
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
			const landingY = this.findLandingSurface(oldFeet, proposedFeet);
			if (landingY !== null) {
				this.body.position.y = landingY + this.currentHeight / 2;
				this.verticalVelocity = 0;
				this.grounded = true;
				return;
			}
		} else {
			const proposedHead = oldHead + deltaY;
			const ceilingY = this.findCeiling(oldHead, proposedHead);
			if (ceilingY !== null) {
				this.body.position.y = ceilingY - this.currentHeight / 2 - CEILING_CLEARANCE;
				this.verticalVelocity = 0;
				return;
			}
		}
		this.body.position.y += deltaY;
	}

	findLandingSurface(oldFeet, proposedFeet) {
		const radius = PLAYER_CONFIG.WIDTH / 2 - 0.03;
		const probes = [
			[this.body.position.x, this.body.position.z],
			[this.body.position.x - radius, this.body.position.z - radius],
			[this.body.position.x + radius, this.body.position.z - radius],
			[this.body.position.x - radius, this.body.position.z + radius],
			[this.body.position.x + radius, this.body.position.z + radius]
		];
		let best = null;
		for (const [x, z] of probes) {
			const surfaceY = this.world.getSurfaceYAt(x, z, Math.ceil(oldFeet + 0.25));
			if (surfaceY === null) continue;
			if (surfaceY > oldFeet + GROUND_TOLERANCE) continue;
			if (surfaceY < proposedFeet - GROUND_TOLERANCE) continue;
			if (best === null || surfaceY > best) best = surfaceY;
		}
		return best;
	}

	findCeiling(oldHead, proposedHead) {
		const radius = PLAYER_CONFIG.WIDTH / 2 - 0.03;
		const probes = [
			[this.body.position.x, this.body.position.z],
			[this.body.position.x - radius, this.body.position.z - radius],
			[this.body.position.x + radius, this.body.position.z - radius],
			[this.body.position.x - radius, this.body.position.z + radius],
			[this.body.position.x + radius, this.body.position.z + radius]
		];
		let nearest = null;
		for (const [x, z] of probes) {
			const ceilingY = this.world.getCeilingBottomYAt(x, z, oldHead, proposedHead);
			if (ceilingY === null) continue;
			if (nearest === null || ceilingY < nearest) nearest = ceilingY;
		}
		return nearest;
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
		const feetY = this.getFeetY();
		const landingY = this.findLandingSurface(feetY + GROUND_TOLERANCE, feetY - GROUND_TOLERANCE);
		if (landingY === null) {
			this.grounded = false;
			return;
		}
		const distance = feetY - landingY;
		const canStand = distance >= -GROUND_TOLERANCE && distance <= GROUND_TOLERANCE;
		this.grounded = canStand;
		if (canStand && snap) {
			this.body.position.y = landingY + this.currentHeight / 2;
			this.verticalVelocity = 0;
		}
	}

	getSuffocationBlock() {
		const feetY = this.getFeetY();
		const eyeLevel = this.sneaking ? PLAYER_CONFIG.SNEAK_EYE_LEVEL : PLAYER_CONFIG.EYE_LEVEL;
		const eyeY = feetY + eyeLevel;
		const radius = PLAYER_CONFIG.WIDTH / 2 - 0.04;
		const probes = [
			[this.body.position.x, eyeY, this.body.position.z],
			[this.body.position.x - radius, eyeY, this.body.position.z - radius],
			[this.body.position.x + radius, eyeY, this.body.position.z - radius],
			[this.body.position.x - radius, eyeY, this.body.position.z + radius],
			[this.body.position.x + radius, eyeY, this.body.position.z + radius]
		];
		for (const [x, y, z] of probes) {
			const bx = Math.floor(x);
			const by = Math.floor(y);
			const bz = Math.floor(z);
			const id = this.world.getBlock(bx, by, bz);
			if (this.world.isSolid(bx, by, bz)) return { x: bx, y: by, z: bz, id };
		}
		return null;
	}

	isSuffocating() {
		return this.getSuffocationBlock() !== null;
	}

	intersectsBlock(x, y, z) {
		const half = PLAYER_CONFIG.WIDTH / 2;
		const minX = this.body.position.x - half;
		const maxX = this.body.position.x + half;
		const minY = this.getFeetY();
		const maxY = minY + this.currentHeight;
		const minZ = this.body.position.z - half;
		const maxZ = this.body.position.z + half;
		return maxX > x && minX < x + 1 && maxY > y && minY < y + 1 && maxZ > z && minZ < z + 1;
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
