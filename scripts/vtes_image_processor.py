from PIL import Image, ImageFilter
import sys
import os

def process_crypt_card(image_path, output_path):
    """
    Processes a VTES Crypt card using a 'Patch Blur' approach.
    Keeps the base image sharp, but applies heavy blur to specific rectangular patches.
    
    Patches:
    1. Name Bar (Top Left)
    2. Text Box (Bottom) - Avoiding the left discipline strip.
    """
    try:
        with Image.open(image_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            width, height = img.size
            processed_img = img.copy() # Start with sharp base
            
            # Blur Radius
            blur_radius = 20
            
            # --- Apply Patch 1: Name Bar ---
            # Instructions: Left 0%, Top 0%, Width 100%
            # Height inferred as ~12% to cover name but skip art.
            p1_x = 0
            p1_y = 0
            p1_w = int(width * 1.0)
            p1_h = int(height * 0.12)
            
            box_name = (p1_x, p1_y, p1_x + p1_w, p1_y + p1_h)
            
            # Crop, Blur, Paste
            region_name = img.crop(box_name)
            blurred_name = region_name.filter(ImageFilter.GaussianBlur(radius=blur_radius))
            processed_img.paste(blurred_name, box_name)
            
            # --- Apply Patch 2: Text Box ---
            # Instructions: Left 4%, Top 72%, Width 92%, Height 20%
            
            p2_x = int(width * 0.04)
            p2_y = int(height * 0.72)
            p2_w = int(width * 0.92) 
            p2_h = int(height * 0.20)
            
            box_text = (p2_x, p2_y, p2_x + p2_w, p2_y + p2_h)
            
            # Crop, Blur, Paste
            region_text = img.crop(box_text)
            blurred_text = region_text.filter(ImageFilter.GaussianBlur(radius=blur_radius))
            processed_img.paste(blurred_text, box_text)
            
            # Save
            processed_img.save(output_path, quality=95)
            print(f"Processed: {image_path} -> {output_path}")
            return True

    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python vtes_image_processor.py <input_image_path> [output_image_path]")
        sys.exit(1)
        
    input_path = sys.argv[1]
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_patch{ext}"
        
    process_crypt_card(input_path, output_path)
