const MODEL_LAYER = 0x2;
const WORLD_LAYER = 0x1;

const DIMENSIONS = Object.freeze({
	HEAD: 0.46,
	TORSO_WIDTH: 0.52,
	TORSO_HEIGHT: 0.58,
	TORSO_DEPTH: 0.28,
	ARM_WIDTH: 0.18,
	ARM_LENGTH: 0.50,
	ARM_DEPTH: 0.20,
	HAND_LENGTH: 0.12,
	LEG_WIDTH: 0.22,
	LEG_LENGTH: 0.70,
	LEG_DEPTH: 0.24,
	SHOULDER_GAP: -0.015,
	HIP_GAP: 0.0
});

const FACE_UV = Object.freeze([
	new BABYLON.Vector4(0 / 3, 1 / 2, 1 / 3, 2 / 2),
	new BABYLON.Vector4(1 / 3, 1 / 2, 2 / 3, 2 / 2),
	new BABYLON.Vector4(2 / 3, 1 / 2, 3 / 3, 2 / 2),
	new BABYLON.Vector4(0 / 3, 0 / 2, 1 / 3, 1 / 2),
	new BABYLON.Vector4(1 / 3, 0 / 2, 2 / 3, 1 / 2),
	new BABYLON.Vector4(2 / 3, 0 / 2, 3 / 3, 1 / 2)
]);

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function damp(current, target, speed, dt) {
	return BABYLON.Scalar.Lerp(current, target, 1 - Math.exp(-speed * dt));
}

function dampAngle(current, target, speed, dt) {
	const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
	return current + delta * (1 - Math.exp(-speed * dt));
}

function makeTextureMaterial(scene, name, path) {
	const material = new BABYLON.StandardMaterial(name, scene);
	material.specularColor = BABYLON.Color3.Black();
	material.backFaceCulling = true;

	const texture = new BABYLON.Texture(path, scene, true, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	texture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
	texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
	texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
	texture.anisotropicFilteringLevel = 1;
	material.diffuseTexture = texture;
	return material;
}

function makePart(scene, name, dimensions, material, parent, position) {
	const mesh = BABYLON.MeshBuilder.CreateBox(name, {
		...dimensions,
		faceUV: FACE_UV,
		wrap: true
	}, scene);
	mesh.material = material;
	mesh.parent = parent;
	mesh.position.copyFrom(position);
	mesh.isPickable = false;
	mesh.checkCollisions = false;
	mesh.receiveShadows = true;
	mesh.layerMask = MODEL_LAYER;
	mesh.metadata = { isPlayerModel: true };
	return mesh;
}

function makePivot(scene, name, parent, position) {
	const pivot = new BABYLON.TransformNode(name, scene);
	pivot.parent = parent;
	pivot.position.copyFrom(position);
	return pivot;
}

export class PlayerModel {
	constructor(scene) {
		this.scene = scene;
		this.root = new BABYLON.TransformNode('player-model-root', scene);
		this.root.rotationQuaternion = null;
		this.time = 0;
		this.breakTimer = 0;
		this.placeTimer = 0;
		this.firstPerson = true;

		this.materials = {
			head: makeTextureMaterial(scene, 'player-head-material', 'Assets/Player/Default/head.png?v=player-model-20'),
			torso: makeTextureMaterial(scene, 'player-torso-material', 'Assets/Player/Default/torso.png?v=player-model-20'),
			arm: makeTextureMaterial(scene, 'player-arm-material', 'Assets/Player/Default/arm.png?v=player-model-20'),
			hand: makeTextureMaterial(scene, 'player-hand-material', 'Assets/Player/Default/hand.png?v=player-model-20'),
			leg: makeTextureMaterial(scene, 'player-leg-material', 'Assets/Player/Default/leg.png?v=player-model-20')
		};

		const legTopY = DIMENSIONS.LEG_LENGTH;
		const torsoCenterY = legTopY + DIMENSIONS.TORSO_HEIGHT / 2;
		const shoulderY = legTopY + DIMENSIONS.TORSO_HEIGHT - 0.03;
		const neckY = legTopY + DIMENSIONS.TORSO_HEIGHT;

		this.hips = makePivot(scene, 'player-hips', this.root, new BABYLON.Vector3(0, legTopY, 0));
		this.torsoPivot = makePivot(scene, 'player-torso-pivot', this.root, new BABYLON.Vector3(0, torsoCenterY, 0));
		this.headPivot = makePivot(scene, 'player-head-pivot', this.root, new BABYLON.Vector3(0, neckY, 0));

		const shoulderX = DIMENSIONS.TORSO_WIDTH / 2 + DIMENSIONS.ARM_WIDTH / 2 + DIMENSIONS.SHOULDER_GAP;
		this.leftArmPivot = makePivot(scene, 'player-left-arm-pivot', this.root, new BABYLON.Vector3(-shoulderX, shoulderY, 0));
		this.rightArmPivot = makePivot(scene, 'player-right-arm-pivot', this.root, new BABYLON.Vector3(shoulderX, shoulderY, 0));

		const hipX = DIMENSIONS.LEG_WIDTH / 2 + DIMENSIONS.HIP_GAP / 2;
		this.leftLegPivot = makePivot(scene, 'player-left-leg-pivot', this.root, new BABYLON.Vector3(-hipX, legTopY, 0));
		this.rightLegPivot = makePivot(scene, 'player-right-leg-pivot', this.root, new BABYLON.Vector3(hipX, legTopY, 0));

		this.torso = makePart(scene, 'player-torso', {
			width: DIMENSIONS.TORSO_WIDTH,
			height: DIMENSIONS.TORSO_HEIGHT,
			depth: DIMENSIONS.TORSO_DEPTH
		}, this.materials.torso, this.torsoPivot, BABYLON.Vector3.Zero());

		this.head = makePart(scene, 'player-head', {
			width: DIMENSIONS.HEAD,
			height: DIMENSIONS.HEAD,
			depth: DIMENSIONS.HEAD
		}, this.materials.head, this.headPivot, new BABYLON.Vector3(0, DIMENSIONS.HEAD / 2 + 0.02, 0));

		this.leftArm = makePart(scene, 'player-left-arm', {
			width: DIMENSIONS.ARM_WIDTH,
			height: DIMENSIONS.ARM_LENGTH,
			depth: DIMENSIONS.ARM_DEPTH
		}, this.materials.arm, this.leftArmPivot, new BABYLON.Vector3(0, -DIMENSIONS.ARM_LENGTH / 2, 0));

		this.rightArm = makePart(scene, 'player-right-arm', {
			width: DIMENSIONS.ARM_WIDTH,
			height: DIMENSIONS.ARM_LENGTH,
			depth: DIMENSIONS.ARM_DEPTH
		}, this.materials.arm, this.rightArmPivot, new BABYLON.Vector3(0, -DIMENSIONS.ARM_LENGTH / 2, 0));

		this.leftHand = makePart(scene, 'player-left-hand', {
			width: DIMENSIONS.ARM_WIDTH,
			height: DIMENSIONS.HAND_LENGTH,
			depth: DIMENSIONS.ARM_DEPTH
		}, this.materials.hand, this.leftArmPivot, new BABYLON.Vector3(0, -DIMENSIONS.ARM_LENGTH - DIMENSIONS.HAND_LENGTH / 2, 0));

		this.rightHand = makePart(scene, 'player-right-hand', {
			width: DIMENSIONS.ARM_WIDTH,
			height: DIMENSIONS.HAND_LENGTH,
			depth: DIMENSIONS.ARM_DEPTH
		}, this.materials.hand, this.rightArmPivot, new BABYLON.Vector3(0, -DIMENSIONS.ARM_LENGTH - DIMENSIONS.HAND_LENGTH / 2, 0));

		this.leftLeg = makePart(scene, 'player-left-leg', {
			width: DIMENSIONS.LEG_WIDTH,
			height: DIMENSIONS.LEG_LENGTH,
			depth: DIMENSIONS.LEG_DEPTH
		}, this.materials.leg, this.leftLegPivot, new BABYLON.Vector3(0, -DIMENSIONS.LEG_LENGTH / 2, 0));

		this.rightLeg = makePart(scene, 'player-right-leg', {
			width: DIMENSIONS.LEG_WIDTH,
			height: DIMENSIONS.LEG_LENGTH,
			depth: DIMENSIONS.LEG_DEPTH
		}, this.materials.leg, this.rightLegPivot, new BABYLON.Vector3(0, -DIMENSIONS.LEG_LENGTH / 2, 0));

		this.meshes = [this.torso, this.head, this.leftArm, this.rightArm, this.leftHand, this.rightHand, this.leftLeg, this.rightLeg];
		this.setFirstPerson(true);
	}

	setFirstPerson(enabled) {
		this.firstPerson = Boolean(enabled);
	}

	applyCameraLayer(camera) {
		camera.layerMask = this.firstPerson ? WORLD_LAYER : (WORLD_LAYER | MODEL_LAYER);
	}

	triggerBreak() {
		this.breakTimer = 0.26;
	}

	triggerPlace() {
		this.placeTimer = 0.18;
	}

	update(dt, state) {
		this.time += dt;
		this.breakTimer = Math.max(0, this.breakTimer - dt);
		this.placeTimer = Math.max(0, this.placeTimer - dt);

		this.root.position.set(state.x, state.feetY, state.z);
		this.root.rotation.y = dampAngle(this.root.rotation.y, state.yaw, 18, dt);

		const moving = state.moveAmount > 0.04;
		const sprintFactor = state.sprinting ? 1 : 0;
		const crouchFactor = state.sneaking ? 1 : 0;
		const walkFrequency = state.sprinting ? 13.5 : state.sneaking ? 7 : 9.5;
		const walkAmplitude = state.sprinting ? 0.92 : state.sneaking ? 0.32 : 0.58;
		const stride = moving && state.grounded ? Math.sin(this.time * walkFrequency) * walkAmplitude * state.moveAmount : 0;
		const strideOpposite = -stride;

		let leftArmX = strideOpposite * 0.82;
		let rightArmX = stride * 0.82;
		let leftLegX = stride;
		let rightLegX = strideOpposite;
		let torsoX = 0;
		let torsoY = 0;
		let torsoZ = 0;
		let rootBob = moving && state.grounded ? Math.abs(Math.sin(this.time * walkFrequency)) * (state.sprinting ? 0.035 : 0.018) : Math.sin(this.time * 2.1) * 0.006;

		if (!state.grounded) {
			rootBob = 0;
			if (state.verticalVelocity > 0) {
				leftArmX = -0.32;
				rightArmX = -0.32;
				leftLegX = 0.26;
				rightLegX = -0.18;
			} else {
				leftArmX = 0.22;
				rightArmX = 0.22;
				leftLegX = -0.12;
				rightLegX = 0.18;
			}
		}

		if (crouchFactor) {
			torsoX = 0.18;
			torsoY = -0.17;
			torsoZ = 0.05;
			leftLegX += 0.34;
			rightLegX += 0.34;
			leftArmX += 0.12;
			rightArmX += 0.12;
		}

		if (this.breakTimer > 0) {
			const p = 1 - this.breakTimer / 0.26;
			const swing = Math.sin(p * Math.PI) * 1.35;
			rightArmX = -0.55 - swing;
			this.rightArmPivot.rotation.z = -0.08 - Math.sin(p * Math.PI) * 0.16;
		} else if (this.placeTimer > 0) {
			const p = 1 - this.placeTimer / 0.18;
			const jab = Math.sin(p * Math.PI) * 0.75;
			rightArmX = -0.62 - jab;
			this.rightArmPivot.rotation.z = -0.12;
		} else {
			this.rightArmPivot.rotation.z = damp(this.rightArmPivot.rotation.z, 0, 14, dt);
		}

		const sprintLean = sprintFactor * 0.09;
		torsoX += sprintLean;

		this.leftArmPivot.rotation.x = damp(this.leftArmPivot.rotation.x, leftArmX, 14, dt);
		this.rightArmPivot.rotation.x = damp(this.rightArmPivot.rotation.x, rightArmX, 18, dt);
		this.leftLegPivot.rotation.x = damp(this.leftLegPivot.rotation.x, leftLegX, 16, dt);
		this.rightLegPivot.rotation.x = damp(this.rightLegPivot.rotation.x, rightLegX, 16, dt);
		this.torsoPivot.rotation.x = damp(this.torsoPivot.rotation.x, torsoX, 12, dt);
		this.torsoPivot.position.y = damp(this.torsoPivot.position.y, DIMENSIONS.LEG_LENGTH + DIMENSIONS.TORSO_HEIGHT / 2 + torsoY + rootBob, 14, dt);
		this.torsoPivot.position.z = damp(this.torsoPivot.position.z, torsoZ, 14, dt);

		this.headPivot.position.y = damp(this.headPivot.position.y, DIMENSIONS.LEG_LENGTH + DIMENSIONS.TORSO_HEIGHT + torsoY + rootBob, 14, dt);
		this.headPivot.position.z = damp(this.headPivot.position.z, torsoZ, 14, dt);
		this.headPivot.rotation.x = damp(this.headPivot.rotation.x, clamp(state.pitch, -1.15, 1.15), 18, dt);
		this.headPivot.rotation.y = 0;

		const shoulderBaseY = DIMENSIONS.LEG_LENGTH + DIMENSIONS.TORSO_HEIGHT - 0.03 + torsoY + rootBob;
		this.leftArmPivot.position.y = damp(this.leftArmPivot.position.y, shoulderBaseY, 14, dt);
		this.rightArmPivot.position.y = damp(this.rightArmPivot.position.y, shoulderBaseY, 14, dt);
		this.leftArmPivot.position.z = damp(this.leftArmPivot.position.z, torsoZ, 14, dt);
		this.rightArmPivot.position.z = damp(this.rightArmPivot.position.z, torsoZ, 14, dt);
	}

	dispose() {
		for (const mesh of this.meshes) mesh.dispose(false, false);
		for (const material of Object.values(this.materials)) {
			material.diffuseTexture?.dispose?.();
			material.dispose();
		}
		this.root.dispose();
	}
}
