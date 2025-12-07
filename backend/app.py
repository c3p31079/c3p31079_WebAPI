from flask import Flask, request, jsonify
import base64, os, json, uuid

app = Flask(__name__, static_url_path="", static_folder="")


DATA_DIR = "data"
IMAGE_DIR = "images"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)

@app.route("/api/measure", methods=["POST"])
def receive_measure():
    data = request.json
    uid = str(uuid.uuid4())

    image_data = base64.b64decode(data["image"])
    img_path = f"{IMAGE_DIR}/{uid}.jpg"

    with open(img_path, "wb") as f:
        f.write(image_data)

    record = {
        "id": uid,
        "time": data["time"],
        "length_cm": data["length_cm"],
        "image": img_path
    }

    with open(f"{DATA_DIR}/{uid}.json", "w") as f:
        json.dump(record, f)

    return jsonify({"status": "ok"})

@app.route("/api/history")
def history():
    items = []
    for f in os.listdir(DATA_DIR):
        with open(os.path.join(DATA_DIR, f)) as fp:
            items.append(json.load(fp))
    return jsonify(items)

@app.route("/images/<path:filename>")
def images(filename):
    return send_from_directory("images", filename)
