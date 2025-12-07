import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend running"

@app.route("/api/save", methods=["POST"])
def save():
    try:
        data = request.get_json()
        image_data = data.get("image")  # base64 文字列
        length = data.get("length")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

        # 画像保存
        image_path = os.path.join(UPLOAD_DIR, f"{timestamp}.jpg")
        with open(image_path, "wb") as f:
            import base64
            f.write(base64.b64decode(image_data))

        # 履歴 JSON 保存
        history = {
            "time": timestamp,
            "length": length,
            "image": image_path
        }
        history_path = os.path.join(HISTORY_DIR, f"{timestamp}.json")
        with open(history_path, "w") as f:
            json.dump(history, f)

        return jsonify({"status": "success", "message": "保存しました"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/history", methods=["GET"])
def history():
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            data = json.load(open(os.path.join(HISTORY_DIR, f)))
            items.append(data)
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
