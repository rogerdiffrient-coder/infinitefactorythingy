import { WORLD_CONFIG } from '../config.js';
import { BLOCKS, getBlockMaterial } from './blockRegistry.js';

const SX = WORLD_CONFIG.CHUNK_SIZE_X;
const SY = WORLD_CONFIG.CHUNK_SIZE_Y;
const SZ = WORLD_CONFIG.CHUNK_SIZE_Z;

const FACE_DEFINITIONS = [
	{
		dir: [1, 0, 0],
		vertices: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]
	},
	{
		dir: [-1, 0, 0],
		vertices: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]]
	},
	{
		dir: [0, 1, 0],
		vertices: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]]
	},
	{
		dir: [0, -1, 0],
		vertices: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]
	},
	{
		dir: [0, 0, 1],
		vertices: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]]
	},
	{
		dir: [0, 0, -1],
		vertices: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]
	}
];

export class Chunk {
	constructor(world, chunkX, chunkY, chunkZ) {
		this.world = world;
		this.scene = world.scene;
		this.chunkX = chunkX;
		this.chunkY = chunkY;
		this.chunkZ = chunkZ;
		this.blocks = new Uint16Array(SX * SY * SZ);
		this.mesh = null;
	}

	index(x, y, z) {
		return x + SX * (z + SZ * y);
	}

	getLocal(x, y, z) {
		if (x < 0 || y < 0 || z < 0 || x >= SX || y >= SY || z >= SZ) return BLOCKS.AIR;
		return this.blocks[this.index(x, y, z)];
	}

	setLocal(x, y, z, id) {
		if (x < 0 || y < 0 || z < 0 || x >= SX || y >= SY || z >= SZ) return;
		this.blocks[this.index(x, y, z)] = id;
	}

	worldOrigin() {
		return {
			x: this.chunkX * SX,
			y: this.chunkY * SY,
			z: this.chunkZ * SZ
		};
	}

	rebuildMesh() {
		if (this.mesh) {
			this.mesh.dispose(false, true);
			this.mesh = null;
		}

		const positions = [];
		const indices = [];
		const uvs = [];
		const normals = [];
		const origin = this.worldOrigin();
		let vertexBase = 0;
		let faceCount = 0;

		for (let y = 0; y < SY; y++) {
			for (let z = 0; z < SZ; z++) {
				for (let x = 0; x < SX; x++) {
					const blockId = this.getLocal(x, y, z);
					if (blockId === BLOCKS.AIR) continue;

					const worldX = origin.x + x;
					const worldY = origin.y + y;
					const worldZ = origin.z + z;

					for (const face of FACE_DEFINITIONS) {
						const [dx, dy, dz] = face.dir;
						if (this.world.getBlock(worldX + dx, worldY + dy, worldZ + dz) !== BLOCKS.AIR) continue;

						for (const [vx, vy, vz] of face.vertices) {
							positions.push(x + vx, y + vy, z + vz);
						}

						uvs.push(0, 1, 0, 0, 1, 0, 1, 1);
						indices.push(
							vertexBase,
							vertexBase + 1,
							vertexBase + 2,
							vertexBase,
							vertexBase + 2,
							vertexBase + 3
						);
						vertexBase += 4;
						faceCount++;
					}
				}
			}
		}

		if (positions.length === 0) return;

		BABYLON.VertexData.ComputeNormals(positions, indices, normals);

		const mesh = new BABYLON.Mesh(`chunk-${this.chunkX}-${this.chunkY}-${this.chunkZ}`, this.scene);
		const vertexData = new BABYLON.VertexData();
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.uvs = uvs;
		vertexData.normals = normals;
		vertexData.applyToMesh(mesh, true);

		mesh.position.set(origin.x, origin.y, origin.z);
		mesh.material = getBlockMaterial(this.scene, BLOCKS.GRASS);
		mesh.checkCollisions = true;
		mesh.isPickable = true;
		mesh.metadata = {
			isVoxelChunk: true,
			chunk: this,
			faceCount
		};
		mesh.freezeWorldMatrix();
		mesh.freezeNormals();

		this.mesh = mesh;
	}
}
