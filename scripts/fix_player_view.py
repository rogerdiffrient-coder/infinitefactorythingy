from pathlib import Path


def replace_once(path, old, new):
	file = Path(path)
	text = file.read_text(encoding='utf-8')
	if new in text:
		print('already patched', path)
		return
	if old not in text:
		raise RuntimeError(f'Patch target not found in {path}')
	file.write_text(text.replace(old, new, 1), encoding='utf-8')
	print('patched', path)


replace_once(
	'src/player/playerModel.js',
	"\t\t}, this.materials.head, this.headPivot, new BABYLON.Vector3(0, DIMENSIONS.HEAD / 2 + 0.02, 0));\n\n\t\tthis.leftArm = makePart",
	"\t\t}, this.materials.head, this.headPivot, new BABYLON.Vector3(0, DIMENSIONS.HEAD / 2 + 0.02, 0));\n\t\t// Babylon's box front face is -Z, while this character's forward direction is +Z.\n\t\t// Rotate only the head mesh so the face artwork is actually on the character's front.\n\t\tthis.head.rotation.y = Math.PI;\n\n\t\tthis.leftArm = makePart"
)

replace_once(
	'src/player/playerController.js',
	"\tpickTarget() {\n\t\tconst ray = this.camera.getForwardRay(PLAYER_CONFIG.MAX_REACH);\n\t\treturn this.scene.pickWithRay(ray, mesh => Boolean(mesh.metadata?.isVoxelChunk));\n\t}\n",
	"\tgetEyePosition() {\n\t\tconst eyeLevel = this.sneaking ? PLAYER_CONFIG.SNEAK_EYE_LEVEL : PLAYER_CONFIG.EYE_LEVEL;\n\t\treturn new BABYLON.Vector3(this.body.position.x, this.getFeetY() + eyeLevel, this.body.position.z);\n\t}\n\n\tpickTarget() {\n\t\t// Third-person cameras sit several blocks away from the player, so a ray limited\n\t\t// to survival reach *from the camera* makes interaction almost unusable. Cast\n\t\t// far enough to cover the camera offset, then enforce reach from the player's eye.\n\t\tconst cameraAllowance = this.thirdPerson ? THIRD_PERSON_DISTANCE + THIRD_PERSON_HEIGHT + 1 : 0;\n\t\tconst ray = this.camera.getForwardRay(PLAYER_CONFIG.MAX_REACH + cameraAllowance);\n\t\tconst hit = this.scene.pickWithRay(ray, mesh => Boolean(mesh.metadata?.isVoxelChunk));\n\t\tif (!hit?.hit || !hit.pickedPoint) return hit;\n\t\tif (BABYLON.Vector3.Distance(this.getEyePosition(), hit.pickedPoint) > PLAYER_CONFIG.MAX_REACH + 0.001) return null;\n\t\treturn hit;\n\t}\n"
)

for path in ('src/player/playerModel.js', 'src/player/playerController.js'):
	file = Path(path)
	text = file.read_text(encoding='utf-8').replace('player-model-20', 'player-model-21')
	file.write_text(text, encoding='utf-8')

for path in ('src/main.js', 'index.html'):
	file = Path(path)
	text = file.read_text(encoding='utf-8').replace('player-model-20', 'player-model-21')
	file.write_text(text, encoding='utf-8')

print('player-model-21 patch complete')
