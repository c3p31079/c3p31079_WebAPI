import os
import json
import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

HISTORY_DIR = "saved_results"
os.makedirs(HISTORY_DIR, exist_ok=True)

# 履歴保存用関数
def save_history(original_path, overlay_path, length_cm):
    now = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    record = {
        "time": now,
        "length_cm": length_cm,
        "image": original_path,
        "overlay": overlay_path
    }
    json_path = os.path.join(HISTORY_DIR, f"{now}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)
    return record

# ホーム
@app.route("/")
def home():
    return "Backend working!"

# 画像アップロード＋線オーバーレイ保存
@app.route("/api/upload", methods=["POST"])
def upload():
    if "image" not in request.files or "overlay" not in request.files:
        return jsonify({"error": "image or overlay missing"}), 400

    length_cm = float(request.form.get("length_cm", 0))

    img = request.files["image"]
    overlay = request.files["overlay"]

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    original_path = os.path.join(HISTORY_DIR, f"{timestamp}.png")
    overlay_path = os.path.join(HISTORY_DIR, f"{timestamp}_overlay.png")

    img.save(original_path)
    overlay.save(overlay_path)

    record = save_history(original_path, overlay_path, length_cm)
    return jsonify(record)

# 履歴一覧
@app.route("/api/history")
def history():
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            with open(os.path.join(HISTORY_DIR, f), "r", encoding="utf-8") as fp:
                data = json.load(fp)
            items.append(data)
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

# 保存画像取得
@app.route("/image/<path:filename>")
def image(filename):
    filepath = os.path.join(HISTORY_DIR, filename)
    if not os.path.exists(filepath):
        return "Not found", 404
    return send_file(filepath, mimetype="image/png")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
