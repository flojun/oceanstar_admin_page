import cv2
import numpy as np
import glob
import os

def get_horizon_angle(image_path):
    img = cv2.imread(image_path)
    if img is None: return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLines(edges, 1, np.pi / 180, 100) # Lower threshold for more lines
    
    angles = []
    if lines is not None:
        for line in lines:
            rho, theta = line[0]
            angle = theta * 180 / np.pi
            # Look for lines near horizontal (80 to 100 degrees)
            if 75 < angle < 105:
                # tilt is positive if right side is lower
                angles.append(angle - 90)
                
    if not angles:
        return 0.0
    
    # Return median angle
    return np.median(angles)

folder = "public/images_option_card"
files = glob.glob(f"{folder}/*.jpg")
print(f"Found {len(files)} images")
for file in files:
    angle = get_horizon_angle(file)
    # the image rotation needed is negative of the tilt
    rotation_needed = -angle
    print(f"{os.path.basename(file)}:{rotation_needed:.2f}")
