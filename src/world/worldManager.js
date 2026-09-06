const STORAGE_KEY = 'ift-worlds-v1';

function readStore() {
	try {
		const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"worlds":[]}');
		return Array.isArray(parsed.worlds) ? parsed : { worlds: [] };
	} catch {
		return { worlds: [] };
	}
}

function writeStore(store) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function makeId() {
	if (crypto?.randomUUID) return crypto.randomUUID();
	return `world-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function randomSeed() {
	const values = new Uint32Array(1);
	crypto.getRandomValues(values);
	return values[0] | 0;
}

export class WorldManager {
	list() {
		return readStore().worlds.sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
	}

	get(id) {
		return this.list().find(world => world.id === id) ?? null;
	}

	create(name, seed = randomSeed()) {
		const store = readStore();
		const now = Date.now();
		const world = {
			id: makeId(),
			name: (name || 'New World').trim().slice(0, 48) || 'New World',
			seed: Number(seed) | 0,
			createdAt: now,
			lastPlayedAt: now,
			blocks: {}
		};
		store.worlds.push(world);
		writeStore(store);
		return world;
	}

	rename(id, name) {
		const store = readStore();
		const world = store.worlds.find(item => item.id === id);
		if (!world) return null;
		world.name = (name || world.name).trim().slice(0, 48) || world.name;
		writeStore(store);
		return world;
	}

	delete(id) {
		const store = readStore();
		store.worlds = store.worlds.filter(world => world.id !== id);
		writeStore(store);
	}

	touch(id) {
		const store = readStore();
		const world = store.worlds.find(item => item.id === id);
		if (!world) return;
		world.lastPlayedAt = Date.now();
		writeStore(store);
	}

	saveBlocks(id, blocks) {
		const store = readStore();
		const world = store.worlds.find(item => item.id === id);
		if (!world) return;
		world.blocks = blocks;
		world.lastPlayedAt = Date.now();
		writeStore(store);
	}
}
