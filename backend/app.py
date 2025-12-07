import os
import json
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

# 画像・データ保存
@app.route("/api/save", methods=["POST"])
def save():
    try:
        data = request.json
        if not data or "image" not in data or "length" not in data:
            return jsonify({"status": "error", "message": "image または length がありません"}), 400

        # base64デコード
        img_data = base64.b64decode(data["image"].split(",")[1] if "," in data["image"] else data["image"])

        # タイムスタンプ
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        img_filename = f"{timestamp}.jpg"
        img_path = os.path.join(UPLOAD_DIR, img_filename)

        # 画像保存
        with open(img_path, "wb") as f:
            f.write(img_data)

        # 履歴情報
        record = {
            "image": img_filename,
            "length": data["length"],
            "time": data.get("time", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "image_url": f"/uploads/{img_filename}"  # Webでアクセス可能
        }

        # JSON履歴保存
        json_filename = os.path.join(HISTORY_DIR, f"{timestamp}.json")
        with open(json_filename, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        return jsonify({"status": "success", "message": "保存しました"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# 測定履歴一覧取得
@app.route("/api/history")
def history():
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            with open(os.path.join(HISTORY_DIR, f), "r", encoding="utf-8") as jf:
                data = json.load(jf)
            # 画像URLを補正（Webでアクセス可能）
            data["image_url"] = f"/uploads/{data['image']}"
            items.append(data)
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

# アップロード画像提供
@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# 実行
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
