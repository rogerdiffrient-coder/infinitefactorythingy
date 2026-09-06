import { WORLD_CONFIG } from '../config.js?v=bug-sweep-15';
import { BLOCKS, getBlockMaterial } from './blockRegistry.js?v=bug-sweep-15';

const SX = WORLD_CONFIG.CHUNK_SIZE_X;
const SY = WORLD_CONFIG.CHUNK_SIZE_Y;
const SZ = WORLD_CONFIG.CHUNK_SIZE_Z;

const FACE_DEFINITIONS = [
	{ dir: [1, 0, 0], vertices: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
	{ dir: [-1, 0, 0], vertices: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
	{ dir: [0, 1, 0], vertices: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
	{ dir: [0, -1, 0], vertices: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
	{ dir: [0, 0, 1], vertices: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
	{ dir: [0, 0, -1], vertices: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] }
];

const UV_ROTATIONS = [
	[0, 1, 0, 0, 1, 0, 1, 1],
	[0, 0, 1, 0, 1, 1, 0, 1],
	[1, 0, 1, 1, 0, 1, 0, 0],
	[1, 1, 0, 1, 0, 0, 1, 0]
];

function hashRotation(seed, x, y, z, faceIndex) {
	let h = seed | 0;
	h ^= Math.imul(x | 0, 0x27d4eb2d);
	h ^= Math.imul(y | 0, 0x165667b1);
	h ^= Math.imul(z | 0, 0x1b873593);
	h ^= Math.imul(faceIndex + 1, 0x85ebca6b);
	h ^= h >>> 16;
	h = Math.imul(h, 0x7feb352d);
	h ^= h >>> 15;
	return (h >>> 0) & 3;
}

function createGroup() {
	return { positions: [], indices: [], uvs: [], normals: [], vertexBase: 0, faces: 0 };
}

export class Chunk {
	constructor(world, chunkX, chunkY, chunkZ) {
		this.world = world;
		this.scene = world.scene;
		this.chunkX = chunkX;
		this.chunkY = chunkY;
		this.chunkZ = chunkZ;
		this.blocks = new Uint16Array(SX * SY * SZ);
		this.mesh = null;
		this.multiMaterial = null;
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
		return { x: this.chunkX * SX, y: this.chunkY * SY, z: this.chunkZ * SZ };
	}

	disposeMesh() {
		if (this.mesh) {
			this.mesh.dispose(false, false);
			this.mesh = null;
		}
		if (this.multiMaterial) {
			this.multiMaterial.dispose(false, false);
			this.multiMaterial = null;
		}
	}

	rebuildMesh() {
		this.disposeMesh();

		const origin = this.worldOrigin();
		const groups = new Map();
		let totalFaces = 0;

		for (let y = 0; y < SY; y++) {
			for (let z = 0; z < SZ; z++) {
				for (let x = 0; x < SX; x++) {
					const blockId = this.getLocal(x, y, z);
					if (blockId === BLOCKS.AIR) continue;

					let group = groups.get(blockId);
					if (!group) {
						group = createGroup();
						groups.set(blockId, group);
					}

					const worldX = origin.x + x;
					const worldY = origin.y + y;
					const worldZ = origin.z + z;

					for (let faceIndex = 0; faceIndex < FACE_DEFINITIONS.length; faceIndex++) {
						const face = FACE_DEFINITIONS[faceIndex];
						const [dx, dy, dz] = face.dir;
						if (this.world.getBlock(worldX + dx, worldY + dy, worldZ + dz) !== BLOCKS.AIR) continue;

						for (const [vx, vy, vz] of face.vertices) {
							group.positions.push(x + vx, y + vy, z + vz);
							group.normals.push(dx, dy, dz);
						}
						group.uvs.push(...UV_ROTATIONS[hashRotation(this.world.seed, worldX, worldY, worldZ, faceIndex)]);
						group.indices.push(
							group.vertexBase,
							group.vertexBase + 2,
							group.vertexBase + 1,
							group.vertexBase,
							group.vertexBase + 3,
							group.vertexBase + 2
						);
						group.vertexBase += 4;
						group.faces++;
						totalFaces++;
					}
				}
			}
		}

		if (totalFaces === 0) {
			if (!this.world.generating) this.scene.metadata?.iftRefreshShadowCasters?.();
			return;
		}

		const positions = [];
		const indices = [];
		const uvs = [];
		const normals = [];
		const materialGroups = [];
		let vertexOffset = 0;
		let indexOffset = 0;

		for (const [blockId, group] of groups) {
			const vertexCount = group.positions.length / 3;
			const indexCount = group.indices.length;
			positions.push(...group.positions);
			uvs.push(...group.uvs);
			normals.push(...group.normals);
			indices.push(...group.indices.map(index => index + vertexOffset));
			materialGroups.push({ blockId, vertexOffset, vertexCount, indexOffset, indexCount });
			vertexOffset += vertexCount;
			indexOffset += indexCount;
		}

		const mesh = new BABYLON.Mesh(`chunk-${this.chunkX}-${this.chunkY}-${this.chunkZ}`, this.scene);
		const vertexData = new BABYLON.VertexData();
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.uvs = uvs;
		vertexData.normals = normals;
		vertexData.applyToMesh(mesh, true);
		mesh.position.set(origin.x, origin.y, origin.z);

		if (materialGroups.length === 1) {
			mesh.material = getBlockMaterial(this.scene, materialGroups[0].blockId);
		} else {
			const multiMaterial = new BABYLON.MultiMaterial(`chunk-material-${this.chunkX}-${this.chunkY}-${this.chunkZ}`, this.scene);
			multiMaterial.subMaterials = materialGroups.map(group => getBlockMaterial(this.scene, group.blockId));
			mesh.material = multiMaterial;
			this.multiMaterial = multiMaterial;
			mesh.subMeshes = [];
			materialGroups.forEach((group, materialIndex) => {
				new BABYLON.SubMesh(materialIndex, group.vertexOffset, group.vertexCount, group.indexOffset, group.indexCount, mesh);
			});
		}

		mesh.checkCollisions = true;
		mesh.isPickable = true;
		mesh.receiveShadows = true;
		mesh.alwaysSelectAsActiveMesh = false;
		mesh.metadata = { isVoxelChunk: true, chunk: this, faceCount: totalFaces };
		mesh.freezeWorldMatrix();
		mesh.freezeNormals();
		this.mesh = mesh;

		if (!this.world.generating) this.scene.metadata?.iftRefreshShadowCasters?.();
	}
}
