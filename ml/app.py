"""
SnapPlate ML Microservice
Flask REST API wrapping the OpenCV + pytesseract OCR engine.
Runs on port 8000.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from ocr_engine import process_image

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "SnapPlate OCR"})


@app.route("/api/ocr", methods=["POST"])
def ocr():
    if "image" not in request.files:
        return jsonify({"error": "No image file in request. Key must be 'image'."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    image_bytes = file.read()
    result = process_image(image_bytes)

    if result is None:
        return jsonify({"success": False, "error": "Could not detect a license plate in the image."}), 200

    return jsonify(result)


if __name__ == "__main__":
    print("🔬 SnapPlate OCR Service starting on http://localhost:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
