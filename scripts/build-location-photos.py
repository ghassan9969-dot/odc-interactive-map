"""
Turn the college's photographs into the web assets the location cards use.

Reads the eight originals from a folder given on the command line, and
writes WebP versions into src/assets/locations/. The originals are never
copied into the repository: .gitignore already keeps JPEGs out, and only
the WebP output is committed.

Two of the eight are cropped before resizing. The multimedia room is a
portrait shot with a lot of ceiling and an oversized desk in front; the
undergraduate clinic has a deep ceiling and an empty floor. Both are
trimmed to the part of the room the card is meant to show, and the crop
box is a fraction of the source so it survives a different resolution.

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
    ("CSL", "csl.webp", None),
    ("Postgraduate Clinic", "postgraduate-clinic.webp", None),
    ("Mixed common room", "students-mixed-common-room.webp", None),
    ("Lecture theater", "lecture-rooms.webp", None),
    ("Library", "library.webp", None),
    ("Cafeteria", "canteen-restaurant.webp", None),
    # Portrait: the band the college approved, which lands on a true
    # 16:9 without any further resizing.
    ("Multimedia Room", "multimedia-room.webp", (300 / 1600, 975 / 1600)),
    # Keep the students, the stations and the chair; lose ceiling and floor.
    ("Undergraduate Clinic", "undergraduate-clinic.webp", (0.30, 0.86)),
    # Aerial: trim the highway above and the unrelated building below, to a
    # true 16:9 holding both the college and the covered parking.
    ("Oman Dental College Parking", "oman-dental-college-parking.webp", (100 / 1198, 1000 / 1198)),
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
        print(f"{out_name:32s} {image.width:>5} x {image.height:<5} {size / 1024:7.1f} kB")
    print(f"{'total':32s} {'':>5}   {'':<5} {total / 1024:7.1f} kB")


if __name__ == "__main__":
    main()
