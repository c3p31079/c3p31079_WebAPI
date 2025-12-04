import base64
import os

def save_base64_image(base64data, out_path):
    """Base64の画像データをファイルとして保存する"""
    img_data = base64data.split(",")[1]
    with open(out_path, "wb") as f:
        f.write(base64.b64decode(img_data))
