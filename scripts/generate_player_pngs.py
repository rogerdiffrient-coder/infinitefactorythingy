import os
import struct
import zlib

OUT = 'Assets/Player/Default'
SIZE = 16
COLS = 3
ROWS = 2
WIDTH = SIZE * COLS
HEIGHT = SIZE * ROWS


def clamp(value):
	return max(0, min(255, int(value)))


def shade(color, amount):
	r, g, b, a = color
	return (clamp(r + amount), clamp(g + amount), clamp(b + amount), a)


def put_pixel(pixels, x, y, color):
	if 0 <= x < WIDTH and 0 <= y < HEIGHT:
		pixels[y][x] = color


def fill_tile(pixels, tx, ty, base, noise_seed=0):
	x0 = tx * SIZE
	y0 = ty * SIZE
	for y in range(SIZE):
		for x in range(SIZE):
			h = ((x * 37 + y * 19 + noise_seed * 53) ^ (x * y * 11 + noise_seed * 7)) & 7
			amount = (-5, -3, -1, 0, 1, 3, 5, 0)[h]
			put_pixel(pixels, x0 + x, y0 + y, shade(base, amount))


def rect(pixels, tx, ty, x, y, w, h, color):
	x0 = tx * SIZE + x
	y0 = ty * SIZE + y
	for py in range(y0, y0 + h):
		for px in range(x0, x0 + w):
			put_pixel(pixels, px, py, color)


def write_png(path, pixels):
	raw = bytearray()
	for row in pixels:
		raw.append(0)
		for r, g, b, a in row:
			raw.extend((r, g, b, a))

	def chunk(kind, data):
		return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)

	png = bytearray(b'\x89PNG\r\n\x1a\n')
	png += chunk(b'IHDR', struct.pack('>IIBBBBB', WIDTH, HEIGHT, 8, 6, 0, 0, 0))
	png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
	png += chunk(b'IEND', b'')
	with open(path, 'wb') as f:
		f.write(png)


def blank():
	return [[(0, 0, 0, 0) for _ in range(WIDTH)] for _ in range(HEIGHT)]


def make_head():
	p = blank()
	skin = (214, 161, 112, 255)
	hair = (54, 35, 27, 255)
	dark_hair = (38, 24, 20, 255)
	eye = (24, 30, 34, 255)
	shirt = (45, 140, 190, 255)
	for i, (tx, ty) in enumerate(((0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1))):
		fill_tile(p, tx, ty, skin, 10 + i)
	rect(p, 0, 0, 0, 0, 16, 4, hair)
	rect(p, 0, 0, 0, 4, 2, 4, hair)
	rect(p, 0, 0, 14, 4, 2, 4, hair)
	rect(p, 0, 0, 4, 7, 2, 2, eye)
	rect(p, 0, 0, 10, 7, 2, 2, eye)
	rect(p, 0, 0, 6, 12, 4, 1, shade(skin, -35))
	rect(p, 1, 0, 0, 0, 16, 10, hair)
	rect(p, 1, 0, 2, 10, 12, 3, dark_hair)
	rect(p, 2, 0, 0, 0, 16, 5, hair)
	rect(p, 0, 1, 0, 0, 16, 5, hair)
	rect(p, 2, 0, 13, 5, 3, 5, hair)
	rect(p, 0, 1, 0, 5, 3, 5, hair)
	rect(p, 1, 1, 0, 0, 16, 16, hair)
	rect(p, 2, 1, 4, 12, 8, 4, shirt)
	return p


def make_torso():
	p = blank()
	shirt = (40, 132, 181, 255)
	shirt_dark = (27, 91, 132, 255)
	shirt_light = (61, 158, 204, 255)
	for i, (tx, ty) in enumerate(((0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1))):
		fill_tile(p, tx, ty, shirt, 30 + i)
	rect(p, 0, 0, 0, 0, 16, 3, shirt_dark)
	rect(p, 0, 0, 2, 5, 12, 2, shirt_light)
	rect(p, 0, 0, 6, 9, 4, 4, (240, 177, 56, 255))
	rect(p, 0, 0, 7, 10, 2, 2, (255, 224, 117, 255))
	rect(p, 1, 0, 0, 0, 16, 3, shirt_dark)
	rect(p, 1, 0, 4, 6, 8, 5, shirt_dark)
	rect(p, 1, 0, 6, 7, 4, 3, shirt_light)
	rect(p, 2, 0, 0, 0, 3, 16, shirt_dark)
	rect(p, 0, 1, 13, 0, 3, 16, shirt_dark)
	rect(p, 1, 1, 0, 0, 16, 16, shirt_light)
	rect(p, 2, 1, 0, 0, 16, 16, shirt_dark)
	return p


def make_arm():
	p = blank()
	sleeve = (40, 132, 181, 255)
	skin = (214, 161, 112, 255)
	for i, (tx, ty) in enumerate(((0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1))):
		fill_tile(p, tx, ty, sleeve, 50 + i)
	# Babylon's current atlas orientation maps the top of these source tiles to the
	# bottom/wrist end of the arm mesh, so the hand strip belongs at y=0 here.
	for tx, ty in ((0, 0), (1, 0), (2, 0), (0, 1)):
		rect(p, tx, ty, 0, 0, 16, 5, skin)
	rect(p, 1, 1, 0, 0, 16, 16, sleeve)
	rect(p, 2, 1, 0, 0, 16, 16, skin)
	return p


def make_leg():
	p = blank()
	pants = (49, 55, 69, 255)
	pants_light = (66, 74, 91, 255)
	boot = (35, 29, 27, 255)
	for i, (tx, ty) in enumerate(((0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1))):
		fill_tile(p, tx, ty, pants, 70 + i)
	for tx, ty in ((0, 0), (1, 0), (2, 0), (0, 1)):
		rect(p, tx, ty, 0, 12, 16, 4, boot)
		rect(p, tx, ty, 2, 2, 12, 2, pants_light)
	rect(p, 1, 1, 0, 0, 16, 16, pants_light)
	rect(p, 2, 1, 0, 0, 16, 16, boot)
	return p


def replace_in_file(path, old, new):
	with open(path, 'r', encoding='utf-8') as f:
		content = f.read()
	if old not in content:
		return
	with open(path, 'w', encoding='utf-8') as f:
		f.write(content.replace(old, new))
	print('patched', path)


os.makedirs(OUT, exist_ok=True)
for name, maker in (
	('head.png', make_head),
	('torso.png', make_torso),
	('arm.png', make_arm),
	('leg.png', make_leg),
):
	write_png(os.path.join(OUT, name), maker())
	print('wrote', os.path.join(OUT, name))

replace_in_file('src/player/playerModel.js', "Assets/Player/Default/head.png", "Assets/Player/Default/head.png?v=player-model-19")
replace_in_file('src/player/playerModel.js', "Assets/Player/Default/torso.png", "Assets/Player/Default/torso.png?v=player-model-19")
replace_in_file('src/player/playerModel.js', "Assets/Player/Default/arm.png", "Assets/Player/Default/arm.png?v=player-model-19")
replace_in_file('src/player/playerModel.js', "Assets/Player/Default/leg.png", "Assets/Player/Default/leg.png?v=player-model-19")
replace_in_file('src/player/playerController.js', "./playerModel.js?v=player-model-18", "./playerModel.js?v=player-model-19")
replace_in_file('src/main.js', "./world/blockInteraction.js?v=player-model-18", "./world/blockInteraction.js?v=player-model-19")
replace_in_file('src/main.js', "./player/playerController.js?v=player-model-18", "./player/playerController.js?v=player-model-19")
replace_in_file('index.html', "src/main.js?v=player-model-18", "src/main.js?v=player-model-19")
