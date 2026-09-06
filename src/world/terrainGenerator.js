import { WORLD_CONFIG } from '../config.js';
import { BLOCKS } from './blockRegistry.js';

function smoothstep(value) {
	return value * value * (3 - 2 * value);
}

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function hash2D(seed, x, z) {
	let h = seed | 0;
	h ^= Math.imul(x | 0, 0x27d4eb2d);
	h ^= Math.imul(z | 0, 0x165667b1);
	h ^= h >>> 15;
	h = Math.imul(h, 0x85ebca6b);
	h ^= h >>> 13;
	h = Math.imul(h, 0xc2b2ae35);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967295;
}

export class TerrainGenerator {
	constructor(seed) {
		this.seed = seed | 0;
	}

	valueNoise(x, z, scale) {
		const gx = x / scale;
		const gz = z / scale;
		const x0 = Math.floor(gx);
		const z0 = Math.floor(gz);
		const x1 = x0 + 1;
		const z1 = z0 + 1;
		const tx = smoothstep(gx - x0);
		const tz = smoothstep(gz - z0);

		const a = hash2D(this.seed, x0, z0);
		const b = hash2D(this.seed, x1, z0);
		const c = hash2D(this.seed, x0, z1);
		const d = hash2D(this.seed, x1, z1);
		return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
	}

	heightAt(x, z) {
		const broad = this.valueNoise(x, z, 30);
		const medium = this.valueNoise(x + 913, z - 417, 14);
		const detail = this.valueNoise(x - 271, z + 739, 7);
		const noise = broad * 0.58 + medium * 0.29 + detail * 0.13;
		const centered = (noise - 0.5) * 2;
		const raw = WORLD_CONFIG.TERRAIN_BASE_HEIGHT + centered * WORLD_CONFIG.TERRAIN_HEIGHT_AMPLITUDE;
		return Math.max(
			WORLD_CONFIG.TERRAIN_MIN_HEIGHT,
			Math.min(WORLD_CONFIG.TERRAIN_MAX_HEIGHT, Math.round(raw))
		);
	}

	blockAtDepth(depthFromSurface) {
		if (depthFromSurface === 0) return BLOCKS.GRASS;
		if (depthFromSurface <= WORLD_CONFIG.DIRT_DEPTH) return BLOCKS.DIRT;
		if (depthFromSurface <= WORLD_CONFIG.DIRT_DEPTH + WORLD_CONFIG.TRANSITION_DEPTH) return BLOCKS.DIRT_STONE_MIX;
		return BLOCKS.STONE;
	}
}
