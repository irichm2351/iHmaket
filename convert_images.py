#!/usr/bin/env python3
from PIL import Image
import os

print("Converting images from JPG to PNG...")

# Change to assets/images directory
images_dir = os.path.join(os.path.dirname(__file__), "assets", "images")

# Convert splash.jpg to splash.png
splash_jpg = os.path.join(images_dir, "splash.jpg")
splash_png = os.path.join(images_dir, "splash.png")

if os.path.exists(splash_jpg):
    img = Image.open(splash_jpg)
    img = img.convert("RGB")
    img.save(splash_png)
    print(f"✓ Converted {splash_jpg} to {splash_png}")
else:
    print(f"✗ File not found: {splash_jpg}")

# Convert iHlogo1.jpg to iHlogo1.png
logo_jpg = os.path.join(images_dir, "iHlogo1.jpg")
logo_png = os.path.join(images_dir, "iHlogo1.png")

if os.path.exists(logo_jpg):
    img = Image.open(logo_jpg)
    img = img.convert("RGB")
    img.save(logo_png)
    print(f"✓ Converted {logo_jpg} to {logo_png}")
else:
    print(f"✗ File not found: {logo_jpg}")

print("Image conversion complete!")
