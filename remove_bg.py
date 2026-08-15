from PIL import Image
import sys

def remove_white_bg(img_path):
    # Open the image
    img = Image.open(img_path)
    
    # Convert image to RGBA if it is not
    img = img.convert("RGBA")
    
    # Get data
    datas = img.getdata()
    
    newData = []
    # Define a threshold for "white"
    threshold = 240
    
    for item in datas:
        # Check if the pixel is white or very close to white
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            # Change the white (or near white) pixel to transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    # Update image data
    img.putdata(newData)
    
    # Save the image
    img.save(img_path, "PNG")
    print("Background removed successfully!")

if __name__ == "__main__":
    remove_white_bg("d:/PROJECTS/Parental control app/parent-dashboard/public/logo.png")
