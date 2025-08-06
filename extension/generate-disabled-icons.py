#!/usr/bin/env python3
"""
Generate disabled (grayed out) versions of extension icons
"""

from PIL import Image, ImageEnhance
import os

def create_disabled_icon(input_path, output_path):
    """Create a grayed out version of an icon"""
    try:
        # Open the original icon
        img = Image.open(input_path)
        
        # Convert to grayscale
        gray_img = img.convert('L')
        
        # Convert back to RGBA to maintain transparency
        if img.mode == 'RGBA':
            gray_img = gray_img.convert('RGBA')
            # Apply the original alpha channel
            gray_img.putalpha(img.split()[-1])
        
        # Reduce opacity to make it look disabled
        enhancer = ImageEnhance.Brightness(gray_img)
        disabled_img = enhancer.enhance(0.5)  # Make it 50% dimmer
        
        # Save the disabled version
        disabled_img.save(output_path)
        print(f"✅ Created {output_path}")
        
    except Exception as e:
        print(f"❌ Error creating {output_path}: {e}")

def main():
    """Generate all disabled icon variants"""
    print("🎨 Generating disabled icon variants...")
    
    # Icon sizes to process
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        input_file = f"icons/icon-{size}.png"
        output_file = f"icons/icon-disabled-{size}.png"
        
        if os.path.exists(input_file):
            create_disabled_icon(input_file, output_file)
        else:
            print(f"❌ Missing {input_file}")
    
    print("🎉 Disabled icons generation complete!")

if __name__ == "__main__":
    main()
