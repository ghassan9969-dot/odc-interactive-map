"""
Turn the college's photographs into the web assets the location cards use.

Reads the originals from a folder given on the command line, and writes
WebP versions into src/assets/locations/. The originals are never copied
into the repository: .gitignore already keeps JPEGs out, and only the
WebP output is committed.

Most of the set is already the shape the cards want and is simply
resized. Two are cropped first, and the crop box is a fraction of the
source so it survives a different resolution:

  * the car park, an aerial with a highway above and an unrelated
    building below, trimmed to the college and its covered parking;
  * nothing else. The multimedia room and the undergraduate clinic used
    to be cropped out of portrait originals; the college has since
    supplied both as native 16:9 landscape frames, so those two crops
    are gone.

    python scripts/build-location-photos.py <folder-with-the-jpegs>
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

MAX_WIDTH = 1200
QUALITY = 80

# source stem -> (output name, vertical crop as a fraction of the height)
PHOTOS: list[tuple[str, str, tuple[float, float] | None]] = [
    # --- the original set, processed exactly as the college approved ---
    ("Postgraduate Clinic", "postgraduate-clinic.webp", None),
    ("Mixed common room", "students-mixed-common-room.webp", None),
    ("Lecture theater", "lecture-rooms.webp", None),
    ("Library", "library.webp", None),
    ("Cafeteria", "canteen-restaurant.webp", None),
    # Aerial: trim the highway above and the unrelated building below, to a
    # true 16:9 holding both the college and the covered parking.
    ("Oman Dental College Parking", "oman-dental-college-parking.webp", (100 / 1198, 1000 / 1198)),
    # --- replaced with native 16:9 frames, so no crop at all ---
    ("CSL", "csl.webp", None),
    ("Multimedia Room", "multimedia-room.webp", None),
    ("Undergraduate Clinic", "undergraduate-clinic.webp", None),
    # --- new ---
    ("Coffee Shop", "coffee-shop.webp", None),
    ("Oral Biology Lab", "oral-biology-lab.webp", None),
    ("Prosthodontic Lab", "prosthodontic-lab.webp", None),
    ("Research Hub", "research-hub.webp", None),
    ("Tutorial Room", "tutorial-rooms.webp", None),
    ("X-Ray & CSSD Training", "xray-cssd-training.webp", None),
    # The Plaster Room opens off the Clinical Skills Laboratory, so a
    # visitor is walked to the CSL rather than to its own door. It still
    # has a card of its own, and a card wants a photograph.
    ("Plaster Room", "plaster-room.webp", None),
]

OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "locations"


def find(source: Path, stem: str) -> Path:
    for suffix in (".jpeg", ".jpg", ".JPEG", ".JPG", ".png", ".PNG"):
        candidate = source / f"{stem}{suffix}"
        if candidate.exists():
            return candidate
    raise SystemExit(f"missing source image: {stem}.jpeg in {source}")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source = Path(sys.argv[1])
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    total = 0
    for stem, out_name, crop in PHOTOS:
        image = Image.open(find(source, stem)).convert("RGB")
        if crop:
            top, bottom = crop
            image = image.crop((0, int(image.height * top), image.width, int(image.height * bottom)))
        if image.width > MAX_WIDTH:
            height = round(image.height * MAX_WIDTH / image.width)
            image = image.resize((MAX_WIDTH, height), Image.LANCZOS)
        out = OUT_DIR / out_name
        image.save(out, "WEBP", quality=QUALITY, method=6)
        size = out.stat().st_size
        total += size
        print(f"{out_name:34s} {image.width:>5} x {image.height:<5} {size / 1024:7.1f} kB")
    print(f"{'total':34s} {'':>5}   {'':<5} {total / 1024:7.1f} kB")
    print(f"{len(PHOTOS)} photographs processed")


if __name__ == "__main__":
    main()
