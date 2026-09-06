import { HEALTH_CONFIG } from '../config.js';

const HEART_FULL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAhElEQVR4nGNgoBAwInNERCT+w9hv3rwgSo4FWcF1fim4Bk0Ghv8whfjkUBSI+LpAbNi8h6DTNT8+Y3jz5gUjE7oEMZqRAYoBpGqGG/DmzQtGzY/PiNYEcz6GC8gBcAOIdQWy7RguIGQIumYMA/AZgk0zVgOwGYJLM0EgIiLxHzkJD1MAAMJQVSWuMrWxAAAAAElFTkSuQmCC';
const HEART_HALF = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAlElEQVR4nGNgoBAwInNERCT+w9hv3rwgSo4FWcF1fim4Bk0Ghv8whSIiEv/VNHUQpl1HyDEiaxbxdYHYsHkPXK2/lBBWp9+6foXhzZsXjEzoEsiaiQEoBpCqGW7AmzcvGDU/PiNaE8z5GC4gB8ANINYVyLZjuICQIeiaMQzAZwg2zVgNwGYILs0EgYiIxH/kJDxMAQCwRVjn1WzHpwAAAABJRU5ErkJggg==';
const HEART_EMPTY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcklEQVR4nGNgoBAwInNERCT+w9hv3rwgSo4FWYGapg5Cx3WG/zCF+OSwKyAC3Lp+heHNmxeMTCTpwgKoY8CbNy8Yb12/QrQmmPOp5wJSXIFsO4YLCBmCrhnDAHyGYNOM1QBshuDSTBCIiEj8R07CwxQAAHEqUvOgBYb1AAAAAElFTkSuQmCC';

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

export class HealthSystem {
	constructor(player, healthBar, damageFlash) {
		this.player = player;
		this.healthBar = healthBar;
		this.damageFlash = damageFlash;
		this.maxHealth = HEALTH_CONFIG.MAX_HEALTH;
		this.health = this.maxHealth;
		this.voidTimer = 0;
		this.voidDamageStep = 0;
		this.suffocationTimer = 0;
		this.lastRenderedHealth = null;
		this.heartSlots = [];
		this.buildHud();
		this.render();
	}

	buildHud() {
		this.healthBar.textContent = '';
		for (let i = 0; i < HEALTH_CONFIG.HEARTS; i++) {
			const slot = document.createElement('span');
			slot.className = 'heart-slot';

			const empty = document.createElement('span');
			empty.className = 'heart-image heart-base';
			empty.style.backgroundImage = `url("${HEART_EMPTY}")`;

			const fill = document.createElement('span');
			fill.className = 'heart-fill';

			const full = document.createElement('span');
			full.className = 'heart-image heart-front';
			full.style.backgroundImage = `url("${HEART_FULL}")`;
			fill.append(full);

			slot.append(empty, fill);
			this.healthBar.append(slot);
			this.heartSlots.push({ fill, full });
		}
	}

	update(dt) {
		this.updateVoid(dt);
		this.updateSuffocation(dt);
	}

	updateVoid(dt) {
		if (this.player.getFeetY() >= HEALTH_CONFIG.VOID_DAMAGE_START_Y) {
			this.voidTimer = 0;
			this.voidDamageStep = 0;
			return;
		}

		this.voidTimer += dt;
		while (this.voidTimer >= HEALTH_CONFIG.VOID_TICK_SECONDS) {
			this.voidTimer -= HEALTH_CONFIG.VOID_TICK_SECONDS;
			const damage = HEALTH_CONFIG.VOID_FIRST_DAMAGE + HEALTH_CONFIG.VOID_DAMAGE_STEP * this.voidDamageStep;
			this.voidDamageStep++;
			this.takeDamage(damage);
			if (this.health >= this.maxHealth) break;
		}
	}

	updateSuffocation(dt) {
		if (!this.player.isSuffocating()) {
			this.suffocationTimer = 0;
			return;
		}

		this.suffocationTimer += dt;
		while (this.suffocationTimer >= HEALTH_CONFIG.SUFFOCATION_TICK_SECONDS) {
			this.suffocationTimer -= HEALTH_CONFIG.SUFFOCATION_TICK_SECONDS;
			this.takeDamage(HEALTH_CONFIG.SUFFOCATION_DAMAGE);
			if (this.health >= this.maxHealth) break;
		}
	}

	takeDamage(amount) {
		if (amount <= 0) return;
		this.health = Math.max(0, this.health - amount);
		this.render();
		this.flashDamage();

		if (this.health <= 0) this.respawn();
	}

	respawn() {
		this.player.spawnOnSurface(0.5, 0.5);
		this.health = this.maxHealth;
		this.voidTimer = 0;
		this.voidDamageStep = 0;
		this.suffocationTimer = 0;
		this.render();
	}

	flashDamage() {
		if (!this.damageFlash) return;
		this.damageFlash.classList.remove('hit');
		void this.damageFlash.offsetWidth;
		this.damageFlash.classList.add('hit');
	}

	render() {
		if (this.lastRenderedHealth === this.health) return;
		this.lastRenderedHealth = this.health;
		this.healthBar.setAttribute('aria-label', `Health ${this.health} out of ${this.maxHealth}`);
		this.healthBar.title = `${this.health} / ${this.maxHealth}`;

		for (let i = 0; i < this.heartSlots.length; i++) {
			const heartHealth = clamp(this.health - i * 2, 0, 2);
			const slot = this.heartSlots[i];

			if (heartHealth === 1) {
				slot.full.style.backgroundImage = `url("${HEART_HALF}")`;
				slot.fill.style.width = '100%';
			} else {
				slot.full.style.backgroundImage = `url("${HEART_FULL}")`;
				slot.fill.style.width = `${heartHealth / 2 * 100}%`;
			}
		}
	}
}
