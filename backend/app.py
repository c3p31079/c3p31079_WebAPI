import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app)

# 保存ディレクトリ
UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"

# ディレクトリがなければ作成
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

@app.route("/")
def home():
    return "WebAPI running"

@app.route("/api/upload", methods=["POST"])
def upload():
    """
    Androidから送られた画像と測定結果を保存する
    {
        "image": "base64文字列",
        "length": 123.45
    }
    """
    data = request.json
    if not data or "image" not in data or "length" not in data:
        return jsonify({"success": False, "message": "Invalid data"}), 400

    # 画像デコード
    try:
        img_bytes = base64.b64decode(data["image"].split(",")[-1])
    except Exception as e:
        return jsonify({"success": False, "message": "Image decode failed"}), 400

    # 日付ベースでファイル名生成
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    img_filename = os.path.join(UPLOAD_DIR, f"{timestamp}.jpg")
    json_filename = os.path.join(HISTORY_DIR, f"{timestamp}.json")

    # 画像保存
    with open(img_filename, "wb") as f:
        f.write(img_bytes)

    # 測定データ保存
    record = {
        "time": timestamp,
        "length": data["length"],
        "image": img_filename
    }
    with open(json_filename, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)

    return jsonify({"success": True, "message": "保存しました"})

@app.route("/api/history", methods=["GET"])
def history():
    """
    保存済みの測定履歴一覧を返す
    """
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            with open(os.path.join(HISTORY_DIR, f), encoding="utf-8") as file:
                data = json.load(file)
                # Webで表示できるように image URL を作成
                data["image_url"] = f"/uploads/{os.path.basename(data['image'])}"
                items.append(data)

    # 新しい順にソート
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

# 画像配信用
@app.route("/uploads/<filename>")
def serve_image(filename):
    return app.send_static_file(os.path.join(UPLOAD_DIR, filename))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
