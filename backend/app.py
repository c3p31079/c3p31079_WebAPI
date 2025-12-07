import os
import json
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload():
    data = request.get_json()
    length = data.get("length_cm")
    image_b64 = data.get("image_base64")

    if not length or not image_b64:
        return jsonify({"error": "invalid data"}), 400

    # 保存ファイル名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    image_path = os.path.join(UPLOAD_DIR, f"{timestamp}.jpg")
    with open(image_path, "wb") as f:
        f.write(base64.b64decode(image_b64))

    # 履歴 JSON
    history_item = {
        "time": timestamp,
        "length_cm": length,
        "image": image_path
    }
    history_path = os.path.join(HISTORY_DIR, f"{timestamp}.json")
    with open(history_path, "w") as f:
        json.dump(history_item, f)

    return jsonify({"status": "ok"}), 200

@app.route("/history", methods=["GET"])
def history():
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            path = os.path.join(HISTORY_DIR, f)
            with open(path, "r") as jf:
                data = json.load(jf)
                # 画像は URL に変換（今はローカルパスを返す）
                data["image_url"] = f"/{data['image']}"
                items.append(data)
    # 最新順
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
