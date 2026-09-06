import { randomSeed } from '../world/worldManager.js?v=bug-sweep-15';

function formatTime(timestamp) {
	if (!timestamp) return 'Never played';
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	}).format(new Date(timestamp));
}

export class TitleScreen {
	constructor(manager, elements, callbacks = {}) {
		this.manager = manager;
		this.root = elements.root;
		this.worldList = elements.worldList;
		this.emptyState = elements.emptyState;
		this.newWorldButton = elements.newWorldButton;
		this.createPanel = elements.createPanel;
		this.worldNameInput = elements.worldNameInput;
		this.seedInput = elements.seedInput;
		this.seedRandomButton = elements.seedRandomButton;
		this.createButton = elements.createButton;
		this.cancelCreateButton = elements.cancelCreateButton;
		this.onPlay = callbacks.onPlay ?? (() => {});

		this.newWorldButton.addEventListener('click', () => this.showCreate());
		this.cancelCreateButton.addEventListener('click', () => this.hideCreate());
		this.seedRandomButton.addEventListener('click', () => this.randomizeSeed());
		this.createButton.addEventListener('click', () => this.createWorld());
		this.worldNameInput.addEventListener('keydown', event => {
			if (event.key === 'Enter') this.createWorld();
		});
		this.seedInput.addEventListener('keydown', event => {
			if (event.key === 'Enter') this.createWorld();
		});

		this.render();
	}

	show() {
		this.root.classList.remove('hidden');
		this.render();
	}

	hide() {
		this.root.classList.add('hidden');
		this.hideCreate();
	}

	showCreate() {
		this.createPanel.classList.remove('hidden');
		this.worldNameInput.value = '';
		this.randomizeSeed();
		this.worldNameInput.focus();
	}

	hideCreate() {
		this.createPanel.classList.add('hidden');
	}

	randomizeSeed() {
		this.seedInput.value = String(randomSeed());
	}

	createWorld() {
		const name = this.worldNameInput.value.trim() || 'New World';
		const rawSeed = this.seedInput.value.trim();
		const seed = rawSeed === '' ? randomSeed() : Number(rawSeed);
		const safeSeed = Number.isFinite(seed) ? seed : randomSeed();
		const world = this.manager.create(name, safeSeed);
		this.hideCreate();
		this.render();
		this.onPlay(world);
	}

	renameWorld(world) {
		const nextName = window.prompt('Rename world', world.name);
		if (nextName === null) return;
		this.manager.rename(world.id, nextName);
		this.render();
	}

	deleteWorld(world) {
		if (!window.confirm(`Delete “${world.name}”? This cannot be undone.`)) return;
		this.manager.delete(world.id);
		this.render();
	}

	render() {
		const worlds = this.manager.list();
		this.worldList.textContent = '';
		this.emptyState.classList.toggle('hidden', worlds.length > 0);

		for (const world of worlds) {
			const card = document.createElement('article');
			card.className = 'world-card';

			const info = document.createElement('button');
			info.type = 'button';
			info.className = 'world-card-main';
			info.innerHTML = `
				<div class="world-preview" aria-hidden="true"><span></span></div>
				<div class="world-copy">
					<strong></strong>
					<span class="world-meta"></span>
					<span class="world-seed"></span>
				</div>
			`;
			info.querySelector('strong').textContent = world.name;
			info.querySelector('.world-meta').textContent = `Last played ${formatTime(world.lastPlayedAt)}`;
			info.querySelector('.world-seed').textContent = `Seed ${world.seed}`;
			info.addEventListener('click', () => this.onPlay(world));

			const actions = document.createElement('div');
			actions.className = 'world-actions';
			const rename = document.createElement('button');
			rename.type = 'button';
			rename.textContent = 'Rename';
			rename.addEventListener('click', () => this.renameWorld(world));
			const remove = document.createElement('button');
			remove.type = 'button';
			remove.className = 'danger';
			remove.textContent = 'Delete';
			remove.addEventListener('click', () => this.deleteWorld(world));
			actions.append(rename, remove);

			card.append(info, actions);
			this.worldList.append(card);
		}
	}
}
