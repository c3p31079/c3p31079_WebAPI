import os
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from flask import send_from_directory

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

@app.route("/api/save", methods=["POST"])
def save():
    try:
        data = request.json
        img_data = base64.b64decode(data["image"])
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        img_filename = os.path.join(UPLOAD_DIR, f"{timestamp}.jpg")
        with open(img_filename, "wb") as f:
            f.write(img_data)

        record = {
            "image": img_filename,
            "length": data["length"],
            "time": data["time"]
        }

        json_filename = os.path.join(HISTORY_DIR, f"{timestamp}.json")
        with open(json_filename, "w") as f:
            json.dump(record, f)

        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/history")
def history():
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            with open(os.path.join(HISTORY_DIR, f), "r") as jf:
                data = json.load(jf)
            items.append(data)
    items.sort(key=lambda x: x["time"], reverse=True)
    return jsonify(items)

@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
