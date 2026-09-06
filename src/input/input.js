export class InputState {
	constructor() {
		this.keys = new Set();
		this.justPressed = new Set();

		window.addEventListener('keydown', event => {
			if (!this.keys.has(event.code)) this.justPressed.add(event.code);
			this.keys.add(event.code);
		});

		window.addEventListener('keyup', event => {
			this.keys.delete(event.code);
		});

		window.addEventListener('blur', () => {
			this.keys.clear();
			this.justPressed.clear();
		});
	}

	down(...codes) {
		return codes.some(code => this.keys.has(code));
	}

	consume(code) {
		if (!this.justPressed.has(code)) return false;
		this.justPressed.delete(code);
		return true;
	}

	endFrame() {
		this.justPressed.clear();
	}
}
