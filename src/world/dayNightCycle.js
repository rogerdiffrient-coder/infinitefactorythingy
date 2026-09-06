import { DAYLIGHT_CONFIG, RENDER_CONFIG } from '../config.js';

function clamp01(value) {
	return Math.max(0, Math.min(1, value));
}

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function lerpColor(a, b, t) {
	return new BABYLON.Color3(
		lerp(a.r, b.r, t),
		lerp(a.g, b.g, t),
		lerp(a.b, b.b, t)
	);
}

function createCelestialMaterial(scene, name, texturePath) {
	const material = new BABYLON.StandardMaterial(`${name}-material`, scene);
	material.disableLighting = true;
	material.backFaceCulling = false;
	material.diffuseColor = BABYLON.Color3.White();
	material.emissiveColor = BABYLON.Color3.White();
	material.specularColor = BABYLON.Color3.Black();
	material.fogEnabled = false;

	const texture = new BABYLON.Texture(texturePath, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	texture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
	texture.hasAlpha = true;
	texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
	texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
	material.diffuseTexture = texture;
	material.emissiveTexture = texture;
	material.opacityTexture = texture;
	material.useAlphaFromDiffuseTexture = true;
	return material;
}

function createShadowGenerator(light) {
	const Generator = BABYLON.CascadedShadowGenerator ?? BABYLON.ShadowGenerator;
	const generator = new Generator(1024, light);
	generator.bias = 0.0015;
	generator.normalBias = 0.035;
	generator.usePercentageCloserFiltering = true;
	if ('filteringQuality' in generator && BABYLON.ShadowGenerator?.QUALITY_MEDIUM !== undefined) {
		generator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
	}
	if ('numCascades' in generator) generator.numCascades = 3;
	if ('lambda' in generator) generator.lambda = 0.72;
	if ('stabilizeCascades' in generator) generator.stabilizeCascades = true;
	if ('shadowMaxZ' in generator) generator.shadowMaxZ = 180;
	return generator;
}

export class DayNightCycle {
	constructor(scene) {
		this.scene = scene;
		this.elapsed = DAYLIGHT_CONFIG.START_TIME_SECONDS;
		this.occluded = false;

		this.daySky = new BABYLON.Color3(0.42, 0.72, 0.96);
		this.twilightSky = new BABYLON.Color3(0.76, 0.46, 0.32);
		this.nightSky = new BABYLON.Color3(0.018, 0.032, 0.075);
		this.dayFog = new BABYLON.Color3(...RENDER_CONFIG.FOG_COLOR);
		this.nightFog = new BABYLON.Color3(0.025, 0.04, 0.08);

		this.daySkyLight = new BABYLON.Color3(1, 1, 1);
		this.dayGroundLight = new BABYLON.Color3(0.22, 0.24, 0.27);
		this.twilightSkyLight = new BABYLON.Color3(0.8, 0.68, 0.58);
		this.twilightGroundLight = new BABYLON.Color3(0.16, 0.13, 0.12);
		this.nightSkyLight = new BABYLON.Color3(0.28, 0.36, 0.56);
		this.nightGroundLight = new BABYLON.Color3(0.035, 0.045, 0.07);

		this.ambientLight = new BABYLON.HemisphericLight('ambient-sky-light', new BABYLON.Vector3(0, 1, 0), scene);
		this.ambientLight.diffuse.copyFrom(this.daySkyLight);
		this.ambientLight.groundColor.copyFrom(this.dayGroundLight);
		this.ambientLight.specular = BABYLON.Color3.Black();

		this.sunLight = new BABYLON.DirectionalLight('sun-directional-light', new BABYLON.Vector3(0, -1, 0), scene);
		this.sunLight.diffuse = new BABYLON.Color3(1, 0.97, 0.9);
		this.sunLight.specular = BABYLON.Color3.Black();

		this.moonLight = new BABYLON.DirectionalLight('moon-directional-light', new BABYLON.Vector3(0, -1, 0), scene);
		this.moonLight.diffuse = new BABYLON.Color3(0.48, 0.58, 0.9);
		this.moonLight.specular = BABYLON.Color3.Black();

		this.shadowGenerator = createShadowGenerator(this.sunLight);
		scene.metadata ??= {};
		scene.metadata.iftShadowGenerator = this.shadowGenerator;

		this.sun = BABYLON.MeshBuilder.CreatePlane('sun', {
			size: DAYLIGHT_CONFIG.CELESTIAL_SIZE,
			sideOrientation: BABYLON.Mesh.DOUBLESIDE
		}, scene);
		this.sun.material = createCelestialMaterial(scene, 'sun', 'Assets/Sky/Sun/sun.png');
		this.sun.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
		this.sun.isPickable = false;

		this.moon = BABYLON.MeshBuilder.CreatePlane('moon', {
			size: DAYLIGHT_CONFIG.CELESTIAL_SIZE,
			sideOrientation: BABYLON.Mesh.DOUBLESIDE
		}, scene);
		this.moon.material = createCelestialMaterial(scene, 'moon', 'Assets/Sky/Moon/moon.png');
		this.moon.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
		this.moon.isPickable = false;

		this.update(0, BABYLON.Vector3.Zero());
	}

	reset() {
		this.elapsed = DAYLIGHT_CONFIG.START_TIME_SECONDS;
		this.occluded = false;
	}

	setOccluded(occluded) {
		this.occluded = Boolean(occluded);
	}

	update(dt, center = BABYLON.Vector3.Zero()) {
		this.elapsed = (this.elapsed + dt) % DAYLIGHT_CONFIG.CYCLE_SECONDS;
		const isDay = this.elapsed < DAYLIGHT_CONFIG.DAY_SECONDS;
		const phaseSeconds = isDay ? this.elapsed : this.elapsed - DAYLIGHT_CONFIG.DAY_SECONDS;
		const phaseDuration = isDay ? DAYLIGHT_CONFIG.DAY_SECONDS : DAYLIGHT_CONFIG.NIGHT_SECONDS;
		const progress = clamp01(phaseSeconds / phaseDuration);
		const angle = progress * Math.PI;
		const altitude = Math.max(0, Math.sin(angle));
		const radius = DAYLIGHT_CONFIG.SKY_RADIUS;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		const z = -radius * 0.4;
		const lightMultiplier = this.occluded ? 0.02 : 1;

		if (isDay) {
			this.sun.isVisible = true;
			this.moon.isVisible = false;
			this.sun.position.set(center.x + x, center.y + y, center.z + z);
			this.sunLight.position.copyFrom(this.sun.position);
			this.sunLight.direction.copyFrom(center.subtract(this.sun.position).normalize());
			this.sunLight.intensity = DAYLIGHT_CONFIG.SUN_MAX_INTENSITY * Math.pow(altitude, 0.55) * lightMultiplier;
			this.moonLight.intensity = 0;

			const dayBlend = clamp01(altitude * 3.4);
			const sky = lerpColor(this.twilightSky, this.daySky, dayBlend);
			const fog = lerpColor(this.twilightSky, this.dayFog, dayBlend);
			const ambient = lerp(DAYLIGHT_CONFIG.AMBIENT_TWILIGHT_INTENSITY, DAYLIGHT_CONFIG.AMBIENT_DAY_INTENSITY, dayBlend) * lightMultiplier;
			const skyLight = lerpColor(this.twilightSkyLight, this.daySkyLight, dayBlend);
			const groundLight = lerpColor(this.twilightGroundLight, this.dayGroundLight, dayBlend);
			this.applySky(sky, fog, ambient, skyLight, groundLight);
		} else {
			this.sun.isVisible = false;
			this.moon.isVisible = true;
			this.moon.position.set(center.x + x, center.y + y, center.z + z);
			this.moonLight.position.copyFrom(this.moon.position);
			this.moonLight.direction.copyFrom(center.subtract(this.moon.position).normalize());
			this.sunLight.intensity = 0;
			this.moonLight.intensity = DAYLIGHT_CONFIG.MOON_MAX_INTENSITY * Math.pow(altitude, 0.65) * lightMultiplier;

			const moonBlend = clamp01(altitude * 2.5);
			const sky = lerpColor(this.twilightSky, this.nightSky, moonBlend);
			const fog = lerpColor(this.twilightSky, this.nightFog, moonBlend);
			const ambient = lerp(DAYLIGHT_CONFIG.AMBIENT_TWILIGHT_INTENSITY, DAYLIGHT_CONFIG.AMBIENT_NIGHT_INTENSITY, moonBlend) * lightMultiplier;
			const skyLight = lerpColor(this.twilightSkyLight, this.nightSkyLight, moonBlend);
			const groundLight = lerpColor(this.twilightGroundLight, this.nightGroundLight, moonBlend);
			this.applySky(sky, fog, ambient, skyLight, groundLight);
		}
	}

	applySky(sky, fog, ambientIntensity, skyLight, groundLight) {
		this.scene.clearColor.set(sky.r, sky.g, sky.b, 1);
		this.scene.fogColor.copyFrom(fog);
		this.ambientLight.intensity = ambientIntensity;
		this.ambientLight.diffuse.copyFrom(skyLight);
		this.ambientLight.groundColor.copyFrom(groundLight);
		this.scene.ambientColor.set(0, 0, 0);
	}

	getState() {
		const isDay = this.elapsed < DAYLIGHT_CONFIG.DAY_SECONDS;
		const phaseSeconds = isDay ? this.elapsed : this.elapsed - DAYLIGHT_CONFIG.DAY_SECONDS;
		const phaseDuration = isDay ? DAYLIGHT_CONFIG.DAY_SECONDS : DAYLIGHT_CONFIG.NIGHT_SECONDS;
		return {
			isDay,
			progress: phaseSeconds / phaseDuration,
			label: isDay ? 'DAY' : 'NIGHT'
		};
	}
}
