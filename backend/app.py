from flask import Flask, jsonify
import os
import json

app = Flask(__name__)

HISTORY_DIR = "history"

@app.route("/api/history")
def history():
    items = []

    if not os.path.exists(HISTORY_DIR):
        return jsonify(items)

    for f in os.listdir(HISTORY_DIR):
        if f.endswith(".json"):
            with open(os.path.join(HISTORY_DIR, f), encoding="utf-8") as fp:
                data = json.load(fp)
                items.append(data)

    # 日付の新しい順
    items.sort(key=lambda x: x["date"], reverse=True)
    return jsonify(items)


# ローカル起動用
if __name__ == "__main__":
    os.makedirs(HISTORY_DIR, exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)
