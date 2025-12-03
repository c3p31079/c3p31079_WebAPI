from flask import Flask, jsonify, request
import os, json

app = Flask(__name__)

HISTORY_DIR = "./history"

os.makedirs(HISTORY_DIR, exist_ok=True)

@app.route("/api/history", methods=["GET"])
def get_history():
    items = []
    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            data = json.load(open(os.path.join(HISTORY_DIR,f)))
            items.append(data)
    items.sort(key=lambda x:x["time"], reverse=True)
    return jsonify(items)

@app.route("/api/save", methods=["POST"])
def save_measure():
    data = request.json
    filename = os.path.join(HISTORY_DIR, f"{data['time'].replace(':','-').replace(' ','_')}.json")
    with open(filename,"w") as f:
        json.dump(data,f)
    return jsonify({"status":"ok"})

if __name__=="__main__":
    app.run(host="0.0.0.0", port=5000)
