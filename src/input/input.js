export class InputState {
	constructor() {
		this.keys = new Set();
		this.justPressed = new Set();
		this.modifiers = {
			control: false,
			shift: false,
			alt: false,
			meta: false
		};

		window.addEventListener('keydown', event => {
			if (!this.keys.has(event.code)) this.justPressed.add(event.code);
			this.keys.add(event.code);
			this.updateModifiers(event);
		});

		window.addEventListener('keyup', event => {
			this.keys.delete(event.code);
			this.updateModifiers(event);
		});

		window.addEventListener('blur', () => {
			this.keys.clear();
			this.justPressed.clear();
			this.modifiers.control = false;
			this.modifiers.shift = false;
			this.modifiers.alt = false;
			this.modifiers.meta = false;
		});
	}

	updateModifiers(event) {
		this.modifiers.control = Boolean(event.ctrlKey || this.keys.has('ControlLeft') || this.keys.has('ControlRight'));
		this.modifiers.shift = Boolean(event.shiftKey || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'));
		this.modifiers.alt = Boolean(event.altKey || this.keys.has('AltLeft') || this.keys.has('AltRight'));
		this.modifiers.meta = Boolean(event.metaKey || this.keys.has('MetaLeft') || this.keys.has('MetaRight'));
	}

	down(...codes) {
		return codes.some(code => this.keys.has(code));
	}

	controlDown() {
		return this.modifiers.control || this.down('ControlLeft', 'ControlRight');
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
