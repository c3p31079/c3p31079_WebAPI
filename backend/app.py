import os
import io
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# 設定
UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)

# ホーム
@app.route("/")
def home():
    return "Backend running"

# 画像と測定情報の保存
@app.route("/api/save", methods=["POST"])
def save():
    try:
        # JSONデータを取得
        data = request.get_json()

        if not data:
            return jsonify({"status": "error", "message": "データがありません"}), 400

        # 画像データ（base64）
        image_data = data.get("image")
        length = data.get("length")

        if not image_data or length is None:
            return jsonify({"status": "error", "message": "画像または長さがありません"}), 400

        # ファイル名生成
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        image_filename = f"{timestamp}.jpg"
        image_path = os.path.join(UPLOAD_DIR, image_filename)

        # base64 → バイナリで保存
        import base64
        image_bytes = base64.b64decode(image_data.split(",")[1])
        with open(image_path, "wb") as f:
            f.write(image_bytes)

        # 履歴 JSON 保存
        history_data = {
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "length": length,
            "image": image_filename
        }
        history_filename = f"{timestamp}.json"
        history_path = os.path.join(HISTORY_DIR, history_filename)
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(history_data, f, ensure_ascii=False, indent=2)

        return jsonify({"status": "success", "message": "保存しました"})

    except Exception as e:
        print("保存エラー:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

# 測定履歴一覧
@app.route("/api/history")
def history():
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            data = json.load(open(os.path.join(HISTORY_DIR, f), encoding="utf-8"))
            # 画像URLをWebでアクセス可能にする
            data["image_url"] = f"/uploads/{data['image']}"
            items.append(data)

    # 新しい順にソート
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

# アップロード画像提供
@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# 実行
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
