import { WORLD_CONFIG } from '../config.js';
import { BLOCKS } from './blockRegistry.js';
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

	setBlock(x, y, z, id) {
		const { cx, cy, cz, lx, ly, lz } = this.worldToChunk(x, y, z);
		const chunk = this.ensureChunk(cx, cy, cz);
		chunk.setLocal(lx, ly, lz, id);
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
					this.setBlock(x, y, z, BLOCKS.GRASS);
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
