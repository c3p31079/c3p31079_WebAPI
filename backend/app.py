import os
import json
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Flask アプリ初期化
app = Flask(__name__)
CORS(app)  # CORS許可

# ディレクトリ設定
UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"

# ディレクトリが存在しなければ作成
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload():
    """
    Android から送られてくる JSON を受け取り、
    画像を保存して履歴 JSON を作成する
    """
    data = request.get_json()
    length = data.get("length_cm")
    image_b64 = data.get("image_base64")

    if not length or not image_b64:
        return jsonify({"error": "invalid data"}), 400

    # タイムスタンプでファイル名作成
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    image_filename = f"{timestamp}.jpg"
    image_path = os.path.join(UPLOAD_DIR, image_filename)

    # Base64 → JPEG 保存
    try:
        with open(image_path, "wb") as f:
            f.write(base64.b64decode(image_b64))
    except Exception as e:
        return jsonify({"error": f"画像保存失敗: {str(e)}"}), 500

    # 履歴 JSON 保存
    history_item = {
        "time": timestamp,
        "length_cm": length,
        "image": image_filename
    }
    history_path = os.path.join(HISTORY_DIR, f"{timestamp}.json")
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(history_item, f, ensure_ascii=False)

    return jsonify({"status": "ok"}), 200

@app.route("/history", methods=["GET"])
def history():
    """
    保存した履歴を取得して返す
    """
    items = []
    for filename in os.listdir(HISTORY_DIR):
        if filename.endswith(".json"):
            path = os.path.join(HISTORY_DIR, filename)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["image_url"] = f"/{UPLOAD_DIR}/{data['image']}"
                items.append(data)
    # 最新順にソート
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

@app.route(f"/{UPLOAD_DIR}/<filename>")
def uploaded_file(filename):
    """
    画像をブラウザで参照可能にする
    """
    return app.send_static_file(os.path.join(UPLOAD_DIR, filename))

if __name__ == "__main__":
    # Render でポート指定が必要な場合は環境変数 PORT を使用
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
