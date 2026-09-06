import { WORLD_CONFIG } from '../config.js';
import { BLOCKS, getBlockDefinition } from './blockRegistry.js';
import { Chunk } from './chunk.js';

const SX = WORLD_CONFIG.CHUNK_SIZE_X;
const SY = WORLD_CONFIG.CHUNK_SIZE_Y;
const SZ = WORLD_CONFIG.CHUNK_SIZE_Z;

function floorDiv(value, size) {
	return Math.floor(value / size);
}

function positiveMod(value, size) {
	return ((value % size) + size) % size;
}

export class VoxelWorld {
	constructor(scene) {
		this.scene = scene;
		this.chunks = new Map();
	}

	chunkKey(cx, cy, cz) {
		return `${cx},${cy},${cz}`;
	}

	getChunk(cx, cy, cz) {
		return this.chunks.get(this.chunkKey(cx, cy, cz)) ?? null;
	}

	ensureChunk(cx, cy, cz) {
		const key = this.chunkKey(cx, cy, cz);
		let chunk = this.chunks.get(key);
		if (!chunk) {
			chunk = new Chunk(this, cx, cy, cz);
			this.chunks.set(key, chunk);
		}
		return chunk;
	}

	worldToChunk(x, y, z) {
		return {
			cx: floorDiv(x, SX),
			cy: floorDiv(y, SY),
			cz: floorDiv(z, SZ),
			lx: positiveMod(x, SX),
			ly: positiveMod(y, SY),
			lz: positiveMod(z, SZ)
		};
	}

	getBlock(x, y, z) {
		const { cx, cy, cz, lx, ly, lz } = this.worldToChunk(x, y, z);
		const chunk = this.getChunk(cx, cy, cz);
		if (!chunk) return BLOCKS.AIR;
		return chunk.getLocal(lx, ly, lz);
	}

	isSolid(x, y, z) {
		const definition = getBlockDefinition(this.getBlock(x, y, z));
		return Boolean(definition?.solid);
	}

	setBlock(x, y, z, id) {
		const { cx, cy, cz, lx, ly, lz } = this.worldToChunk(x, y, z);
		const chunk = this.ensureChunk(cx, cy, cz);
		chunk.setLocal(lx, ly, lz, id);
	}

	getSurfaceYAt(x, z, maxY = WORLD_CONFIG.CHUNK_SIZE_Y * 4) {
		const blockX = Math.floor(x);
		const blockZ = Math.floor(z);
		for (let y = Math.floor(maxY); y >= -WORLD_CONFIG.CHUNK_SIZE_Y * 2; y--) {
			if (this.isSolid(blockX, y, blockZ)) return y + 1;
		}
		return null;
	}

	createStarterWorld() {
		const radius = WORLD_CONFIG.STARTER_CHUNK_RADIUS;
		const groundHeight = WORLD_CONFIG.STARTER_GROUND_HEIGHT;

		for (let cz = -radius; cz <= radius; cz++) {
			for (let cx = -radius; cx <= radius; cx++) {
				this.ensureChunk(cx, 0, cz);
			}
		}

		const minX = -radius * SX;
		const maxX = (radius + 1) * SX;
		const minZ = -radius * SZ;
		const maxZ = (radius + 1) * SZ;

		for (let z = minZ; z < maxZ; z++) {
			for (let x = minX; x < maxX; x++) {
				for (let y = 0; y < groundHeight; y++) {
					let block = BLOCKS.STONE;
					if (y === groundHeight - 1) block = BLOCKS.GRASS;
					else if (y === groundHeight - 2) block = BLOCKS.DIRT;
					this.setBlock(x, y, z, block);
				}
			}
		}

		this.rebuildAllChunks();
	}

	rebuildAllChunks() {
		for (const chunk of this.chunks.values()) chunk.rebuildMesh();
	}

	getChunkStats() {
		let faces = 0;
		let meshes = 0;
		for (const chunk of this.chunks.values()) {
			if (!chunk.mesh) continue;
			meshes++;
			faces += chunk.mesh.metadata?.faceCount ?? 0;
		}
		return {
			chunks: this.chunks.size,
			meshes,
			faces
		};
	}
}
