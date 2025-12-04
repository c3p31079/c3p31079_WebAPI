# WebXR カメラから送られてきた画像を保存し、なぞった線の長さデータと結びつけて履歴化する。
import os
import json
import base64
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 保存フォルダ
IMAGE_DIR = "images"
HISTORY_DIR = "history"

# フォルダがなければ作成
os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)


# テスト用
@app.route("/")
def home():
    return "Flask backend running (length-measure version)"


# 画像 + 長さデータの保存
@app.route("/api/save-length", methods=["POST"])
def save_length():
    """
    前端から送信されるデータ：
      - image: base64エンコードされた画像（JPEG）
      - length_mm: 実物の長さ（mm）
      - points: なぞった座標の配列（デバッグ用）
    """

    data = request.json

    # base64画像を取得
    img_base64 = data.get("image")
    length_mm = data.get("length_mm")
    points = data.get("points")  # 任意

    if not img_base64 or not length_mm:
        return jsonify({"error": "invalid data"}), 400

    # base64ヘッダ除去
    if "," in img_base64:
        img_base64 = img_base64.split(",")[1]

    # ファイル名生成
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    img_filename = f"{timestamp}.jpg"
    img_path = os.path.join(IMAGE_DIR, img_filename)

    # 画像保存
    with open(img_path, "wb") as f:
        f.write(base64.b64decode(img_base64))

    # JSON保存
    history_filename = f"{timestamp}.json"
    json_path = os.path.join(HISTORY_DIR, history_filename)

    history_data = {
        "time": timestamp,
        "length_mm": length_mm,
        "image": img_filename,
        "points": points,
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(history_data, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "saved", "timestamp": timestamp})


# 履歴一覧取得
@app.route("/api/history")
def history():
    items = []

    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            path = os.path.join(HISTORY_DIR, f)
            with open(path, "r", encoding="utf-8") as fp:
                data = json.load(fp)

            # フロントで画像を取得するためのURL
            data["image_url"] = f"/image/{data['image']}"

            items.append(data)

    # 新しい順
    items.sort(key=lambda x: x["time"], reverse=True)

    return jsonify(items)


# 画像の配信
@app.route("/image/<filename>")
def serve_image(filename):
    return send_from_directory(IMAGE_DIR, filename)


# メイン
if __name__ == "__main__":
    # 開発用
    app.run(host="0.0.0.0", port=5000, debug=True)
