import sys
from PIL import Image
# usage: montage.py out.png cols w img1 img2 ...
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Image.open(p).convert('RGB') for p in sys.argv[4:]]
ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
rows = (len(ims) + cols - 1) // cols
hh = max(im.height for im in ims)
M = Image.new('RGB', (cols * w, rows * hh), (20, 20, 30))
for i, im in enumerate(ims): M.paste(im, ((i % cols) * w, (i // cols) * hh))
M.save(out)
