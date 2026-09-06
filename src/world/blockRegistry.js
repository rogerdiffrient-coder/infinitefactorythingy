import { WORLD_CONFIG } from '../config.js';

export const BLOCKS = Object.freeze({
	AIR: 0,
	GRASS: 1,
	DIRT: 2,
	STONE: 3,
	DIRT_STONE_MIX: 4
});

export const BLOCK_DEFINITIONS = Object.freeze({
	[BLOCKS.GRASS]: {
		id: BLOCKS.GRASS,
		name: 'Grass Block',
		texture: 'Assets/Blocks/Terrain/Grass-Block/grass-all-faces-v2.png',
		solid: true
	},
	[BLOCKS.DIRT]: {
		id: BLOCKS.DIRT,
		name: 'Dirt Block',
		texture: 'Assets/Blocks/Terrain/Dirt-Block/dirt-all-faces.png',
		solid: true
	},
	[BLOCKS.STONE]: {
		id: BLOCKS.STONE,
		name: 'Stone Block',
		texture: 'Assets/Blocks/Terrain/Stone-Block/stone-all-faces.png',
		solid: true
	},
	[BLOCKS.DIRT_STONE_MIX]: {
		id: BLOCKS.DIRT_STONE_MIX,
		name: 'Dirt-Stone Mix',
		texture: 'Assets/Blocks/Terrain/Dirt-Stone-Mix/dirt-stone-mix-all-faces.png',
		solid: true
	}
});

const materialCache = new Map();

export function getBlockDefinition(id) {
	return BLOCK_DEFINITIONS[id] ?? null;
}

export function getBlockMaterial(scene, id) {
	if (materialCache.has(id)) return materialCache.get(id);

	const definition = getBlockDefinition(id);
	if (!definition) throw new Error(`Unknown block id: ${id}`);

	const material = new BABYLON.StandardMaterial(`block-material-${id}`, scene);
	material.diffuseColor = BABYLON.Color3.White();
	material.specularColor = BABYLON.Color3.Black();
	material.ambientColor = BABYLON.Color3.Black();
	material.emissiveColor = BABYLON.Color3.Black();
	material.backFaceCulling = false;
	material.useVertexColors = true;

	const texture = new BABYLON.Texture(definition.texture, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
	texture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
	texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
	texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
	texture.anisotropicFilteringLevel = 1;
	texture.hasAlpha = false;

	material.diffuseTexture = texture;
	material.useAlphaFromDiffuseTexture = false;
	material.freeze();

	materialCache.set(id, material);
	return material;
}

export function blockUnitsToMeters(blocks) {
	return blocks * WORLD_CONFIG.BLOCK_SIZE;
}
