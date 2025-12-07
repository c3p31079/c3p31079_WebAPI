from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

latest_length = None

@app.route("/api/length", methods=["POST"])
def receive_length():
    global latest_length
    data = request.json
    latest_length = data.get("length_cm")
    return jsonify({"status": "ok"})

@app.route("/api/latest", methods=["GET"])
def latest():
    return jsonify({
        "length_cm": latest_length if latest_length else 0
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
