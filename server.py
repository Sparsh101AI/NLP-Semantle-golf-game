from flask import Flask, render_template, jsonify, request
import os
from hashlib import sha1

app = Flask(__name__)

@app.route("/")
def Index():
        return render_template("index.html")

@app.route('/checkWord', methods=['GET', 'POST'])
def check():
    if request.method == 'GET':
        word = request.args.get('word')
        banned_hashes = set()
        with open(r"Projects\P02\banned.txt") as f:
            for line in f:
                banned_hashes.add(line.strip())
        
        h = sha1()
        try:
            h.update(("banned" + word).encode("ascii"))
        except UnicodeEncodeError:
            return {"isBad": False}
        hash = h.hexdigest()
        if not hash in banned_hashes:
            return {"isBad": False}

        return {"isBad": True, "word": word}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 8082)), debug=True)