from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from urllib.parse import urlparse, parse_qs
import secrets
import time

app = Flask(__name__)

# データベース設定
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{os.environ['DATABASE_USER']}:{os.environ['DATABASE_PASSWORD']}@{os.environ['DATABASE_HOST']}/{os.environ['DATABASE_NAME']}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
port = int(os.environ.get("PORT", 8080))

EXPIRES_TIME = 60 * 60 * 24 * 7

# トークンテーブルのモデル
class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64))
    url = db.Column(db.Text, unique=True)
    limit_times = db.Column(db.Integer)
    expires_at = db.Column(db.TIMESTAMP)

# Token APIのエンドポイント
@app.route('/token', methods=['POST'])
def generate_token():
    url = request.args.get('url')
    limit_times = int(request.args.get('limit_times', 1))
    
    # トークンをデータベースに保存
    new_token = Token(token=secrets.token_hex(), url=url, limit_times=limit_times, expires_at=time.time() + EXPIRES_TIME)
    db.session.add(new_token)
    db.session.commit()
    
    response = {
        "full": f"{new_token.url}?token={new_token.token}",
        "id": new_token.id,
        "token": new_token.token,
        "url": new_token.url,
        "limit_times": new_token.limit_times,
        "expires_at": new_token.expires_at
    }
    return jsonify(response)

# GET Token APIのエンドポイント
@app.route('/token', methods=['GET'])
def get_token():
    url = request.args.get('url')
    token_entry = Token.query.filter_by(url=url).first()
    
    if token_entry is None:
        return jsonify({"error": "Token not found"}), 404
    
    response = {
        "full": f"{token_entry.url}?token={token_entry.token}",
        "id": token_entry.id,
        "token": token_entry.token,
        "url": token_entry.url,
        "limit_times": token_entry.limit_times,
        "expires_at": token_entry.expires_at
    }
    return jsonify(response)

# DELETE Token APIのエンドポイント
@app.route('/token', methods=['DELETE'])
def delete_token():
    url = request.args.get('url')
    token_entry = Token.query.filter_by(url=url).first()
    
    if token_entry is None:
        return jsonify({"error": "Token not found"}), 404
    
    # トークンを削除
    db.session.delete(token_entry)
    db.session.commit()
    
    response = {
        "id": token_entry.id,
        "token": None,
        "url": token_entry.url,
        "limit_times": token_entry.limit_times,
        "expires_at": None
    }
    return jsonify(response)

@app.route('/auth/is_login', methods=['GET'])
def is_login():
    request_url = request.headers.get('request-url')
    parsed_url = urlparse(request_url)
    url = parsed_url.scheme + "://" + parsed_url.hostname + parsed_url.path
    query_parameters = parse_qs(parsed_url.query)

    token_entry = Token.query.filter_by(url=url).first()
    if token_entry is None:
        return jsonify({"error": "Token not found"}), 404
    
    if token_entry.token != query_parameters["token"][0] or token_entry.limit_times == 0:
        return jsonify({"error": "Token is invalid"}), 401
    else:
        token_entry.limit_times -= 1
        db.session.commit()
        return jsonify({"message": "Authenticated"}), 200

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=port)
