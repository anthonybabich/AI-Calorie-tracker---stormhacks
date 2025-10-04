# AI Calorie Estimator Prototype

A small, secure calorie-estimation prototype for a hackathon. This project uses FastAPI for the backend and a simple HTML/JS frontend. It leverages Google's Gemini for multimodal/text assistance with a deterministic fallback for offline use.

## Features

- **FastAPI Backend**: Asynchronous and fast API.
- **Gemini Integration**: Uses Google Gemini for calorie estimation with a safe, offline fallback.
- **Image Validation**: Checks for image blurriness and file size.
- **Secure**: No hardcoded API keys. Uses environment variables and supports GitHub Codespaces secrets.
- **Easy to Run**: Includes a Devcontainer for VS Code / Codespaces and clear local setup instructions.

## Project Structure

```
.
├── .devcontainer/
│   └── devcontainer.json
├── .env.example
├── .gitignore
├── README.md
├── frontend/
│   ├── app.js
│   └── index.html
├── requirements.txt
├── server/
│   ├── __init__.py
│   ├── gemini_client.py
│   ├── image_utils.py
│   ├── main.py
│   └── routes.py
└── tests/
    └── test_blur.py
```

## Run the website + API together

1.  **Create and activate a virtual environment:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate   # Windows: .venv\Scripts\activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up environment variables:**
    ```bash
    # set your key locally:
    echo "GEMINI_API_KEY=YOUR_KEY" > .env
    ```

4.  **Run the server:**
    ```bash
    uvicorn server.main:app --reload --port 8000
    ```
    Then open [http://localhost:8000](http://localhost:8000) in your browser.
    
    **Note:** Codespaces users should forward port 8000.

## Development

### Quick Run

To quickly start the server during development:

```bash
uvicorn server.main:app --reload --port 8000
```

## GitHub Codespaces Setup

1.  **Create a Codespace** for this repository.
2.  **Add your Gemini API key as a Codespaces secret:**
    - Go to your repository's Settings > Secrets and variables > Codespaces.
    - Create a new secret named `GEMINI_API_KEY` with your API key as the value.
3.  The Devcontainer will automatically install dependencies and set the environment variable.
4.  When the server starts, ensure **port 8000** is forwarded to access the application.

## API Usage

### Analyze Image

-   **Endpoint:** `POST /api/analyze`
-   **Request:** `multipart/form-data` with a single field `file` containing the image.

#### `curl` Example

```bash
curl -X POST -F "file=@/path/to/your/image.jpg" http://127.0.0.1:8000/api/analyze
```

#### Success Response

```json
{
  "ok": true,
  "food": "slice of pizza",
  "calories_est": 285,
  "confidence": 0.84,
  "meta": {
    "labels": ["pizza", "cheese"],
    "image_w": 1024,
    "image_h": 768
  }
}
```

#### Error Response (Blurry Image)

```json
{
  "ok": false,
  "reason": "blurry",
  "message": "Image too blurry—please take another photo."
}
```

## Security Notes

-   **Never commit your `.env` file to version control.** The `.gitignore` file is already configured to ignore it.
-   **Rotate API keys if they are ever leaked.**
-   For team projects, prefer per-developer API keys for better auditability and easier revocation.
