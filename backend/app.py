from flask import Flask, request, jsonify
import os
import json
import base64
from datetime import datetime

app = Flask(__name__)
HISTORY_DIR = "history"
os.makedirs(HISTORY_DIR, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload():
    data = request.json
    length = data.get("length_cm")
    image_base64 = data.get("image_base64")

    time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    filename = f"{HISTORY_DIR}/{time_str.replace(' ', '_').replace(':','-')}.jpg"
    with open(filename, "wb") as f:
        f.write(base64.b64decode(image_base64))

    meta = {
        "time": time_str,
        "length_cm": length,
        "image": filename
    }

    json_file = filename.replace(".jpg", ".json")
    with open(json_file, "w") as f:
        json.dump(meta, f)

    return jsonify({"status": "ok"})

@app.route("/history")
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
