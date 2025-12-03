import os
import io
import uuid
import numpy as np
from PIL import Image, ImageDraw
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tensorflow as tf

app = Flask(__name__)
CORS(app)

MODEL_PATH = "model/crack_model.h5"
OUTPUT_DIR = "saved_results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# モデルのロード
model = tf.keras.models.load_model(MODEL_PATH)

def preprocess_image(img):
    img = img.resize((224, 224))
    arr = np.array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr

@app.route("/api/detect-crack", methods=["POST"])
def detect_crack():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img = Image.open(file.stream).convert("RGB")

    # 推論
    arr = preprocess_image(img)
    pred = model.predict(arr)[0][0]  # ひび割れ確率

    # デモ用：簡易ひび割れ描画（赤線）
    draw = ImageDraw.Draw(img)
    w, h = img.size
    draw.line((w*0.1, h*0.5, w*0.9, h*0.5), fill=(255,0,0), width=5)

    # 保存
    uid = str(uuid.uuid4())
    out_path = os.path.join(OUTPUT_DIR, f"{uid}.png")
    img.save(out_path)

    # 結果返却
    return jsonify({
        "id": uid,
        "crack_score": float(pred),
        "saved_image": f"/api/result/{uid}"
    })

@app.route("/api/result/<uid>")
def get_saved(uid):
    path = os.path.join(OUTPUT_DIR, f"{uid}.png")
    if not os.path.exists(path):
        return jsonify({"error": "Not found"}), 404
    return send_file(path, mimetype="image/png")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
