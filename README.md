# Repaint Image One Time Token Server

## Token API (For Back-end Server)

### POST /token?url={url}&limit_times={limit_times}

{url}に対してのトークンを発行します。
{limit_times}には、トークンの使用回数を指定します。省略可能で、デフォルトで1回です。

レスポンス
```json 
{
    "id": 1,
    "token": "a86752fd9b0cebcd18c9a61a6fb94a58",
    "url": "https://example.com/abcde",
    "limit_times": 1,
    "expires_at": "2023-08-21T14:51:16.198Z"
}
```

### GET /token?url={url}

{url}に対しての現在発行されているトークンを取得します。
{url}が存在しない場合は、404を返します。
{url}が存在し、tokenが失効している場合は、tokenとexpires_atがnullのレスポンスを返します。

レスポンス
```json
{
    "id": 1,
    "token": "a86752fd9b0cebcd18c9a61a6fb94a58",
    "url": "https://example.com/abcde",
    "limit_times": 1,
    "expires_at": "2023-08-21T14:51:16.198Z"
}
```
```json
{
    "id": 1,
    "token": null,
    "url": "https://example.com/abcde",
    "limit_times": 1,
    "expires_at": null
}
```

### DELETE /token?url={url}

{url}に対しての現在発行されているトークンを削除します。

レスポンス
```json
{
    "id": 1,
    "token": null,
    "url": "https://example.com/abcde",
    "limit_times": 1,
    "expires_at": null
}
```

## Auth API (For Reverse Proxy)

### GET /auth/is_login

Headerに`request-url`を指定して、`/token?url={request-url}`に対して発行されたトークンを検証します。
