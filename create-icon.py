#!/usr/bin/env python3
"""
REALones App Icon Generator
Following the "Serene Return" design philosophy
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

# Canvas size for app icon
SIZE = 1024

# Color palette - Serene Return
BABY_BLUE = (232, 244, 252)       # #E8F4FC - background
SOFT_AZURE = (184, 223, 245)      # #B8DFF5 - decorative circles
DEEP_BLUE = (30, 58, 95)          # #1E3A5F - "REAL" text
TEAL_ACCENT = (74, 155, 184)      # #4A9BB8 - "ones" text

def create_icon():
    # Create base image with baby blue background
    img = Image.new('RGBA', (SIZE, SIZE), BABY_BLUE)
    draw = ImageDraw.Draw(img)

    # Create soft decorative circles (like the splash screen)
    # These overlap and create depth through transparency

    # Circle layer - we'll composite with transparency
    circle_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    circle_draw = ImageDraw.Draw(circle_layer)

    # Top-right circle (larger, subtle)
    circle_color = (*SOFT_AZURE, 140)  # Semi-transparent
    circle_draw.ellipse(
        [SIZE - 450, -150, SIZE + 150, 450],
        fill=circle_color
    )

    # Bottom-left circle
    circle_draw.ellipse(
        [-180, SIZE - 480, 380, SIZE + 80],
        fill=circle_color
    )

    # Subtle center-left accent circle
    circle_color_light = (*SOFT_AZURE, 80)
    circle_draw.ellipse(
        [-100, 280, 320, 700],
        fill=circle_color_light
    )

    # Composite circles onto base
    img = Image.alpha_composite(img, circle_layer)
    draw = ImageDraw.Draw(img)

    # Load fonts - using system fonts that match the app's typography
    font_path = "/sessions/funny-dazzling-faraday/mnt/.skills/skills/canvas-design/canvas-fonts/"

    # For "REAL" - clean, modern sans-serif
    try:
        font_real = ImageFont.truetype(font_path + "Outfit-Regular.ttf", 220)
        font_ones = ImageFont.truetype(font_path + "Lora-Italic.ttf", 200)
    except:
        # Fallback
        font_real = ImageFont.truetype(font_path + "WorkSans-Regular.ttf", 220)
        font_ones = ImageFont.truetype(font_path + "WorkSans-Italic.ttf", 200)

    # Calculate text positioning for centered composition
    # "REAL" + "ones" should be visually centered

    text_real = "REAL"
    text_ones = "ones"

    # Get text bounding boxes
    bbox_real = draw.textbbox((0, 0), text_real, font=font_real)
    bbox_ones = draw.textbbox((0, 0), text_ones, font=font_ones)

    real_width = bbox_real[2] - bbox_real[0]
    ones_width = bbox_ones[2] - bbox_ones[0]

    total_width = real_width + ones_width - 20  # Slight kerning adjustment

    # Center horizontally
    start_x = (SIZE - total_width) // 2

    # Vertical center with slight upward offset for visual balance
    center_y = SIZE // 2 - 40

    # Draw "REAL" in deep blue
    draw.text(
        (start_x, center_y),
        text_real,
        font=font_real,
        fill=DEEP_BLUE,
        anchor="lm"
    )

    # Draw "ones" in teal accent, positioned after REAL
    ones_x = start_x + real_width - 25  # Tight kerning
    draw.text(
        (ones_x, center_y + 15),  # Slight vertical offset for italic baseline
        text_ones,
        font=font_ones,
        fill=TEAL_ACCENT,
        anchor="lm"
    )

    # Convert to RGB for PNG (remove alpha for app icon compatibility)
    img_rgb = Image.new('RGB', (SIZE, SIZE), BABY_BLUE)
    img_rgb.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)

    # Save
    output_path = "/sessions/funny-dazzling-faraday/mnt/realones-app/assets/icon-new.png"
    img_rgb.save(output_path, "PNG", quality=100)
    print(f"Icon created: {output_path}")

    # Also create adaptive icon version
    adaptive_path = "/sessions/funny-dazzling-faraday/mnt/realones-app/assets/adaptive-icon-new.png"
    img_rgb.save(adaptive_path, "PNG", quality=100)
    print(f"Adaptive icon created: {adaptive_path}")

    return output_path

if __name__ == "__main__":
    create_icon()
