"""
SnapPlate OCR Engine
OpenCV + pytesseract license plate detection pipeline.
"""

import cv2
import numpy as np
import pytesseract
import re

# ── Windows: uncomment and set your Tesseract install path ──────────────────
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


# ── Helpers ──────────────────────────────────────────────────────────────────

def _to_bgr(image_bytes: bytes):
    """Decode raw bytes to a BGR numpy array and downscale to prevent OOM."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    
    if img is None:
        return None
        
    # Resize image to a maximum width/height of 1200px to prevent Out-Of-Memory errors on Render Free Tier
    max_dim = 1200
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        
    return img


def _preprocess(img):
    """
    Stage 1 – noise reduction while preserving edges.
    Returns grayscale image after bilateral filtering.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, d=11, sigmaColor=17, sigmaSpace=17)
    return gray


def _locate_plate(gray):
    """
    Stage 2 – edge-based contour search for a rectangular plate candidate.
    Returns the cropped plate region (grayscale) or None.
    """
    edged = cv2.Canny(gray, 30, 200)

    contours, _ = cv2.findContours(
        edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
    )
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:40]

    plate_contour = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.018 * peri, True)
        if len(approx) == 4:
            plate_contour = approx
            break

    if plate_contour is None:
        return None

    mask = np.zeros(gray.shape, np.uint8)
    cv2.drawContours(mask, [plate_contour], 0, 255, -1)

    ys, xs = np.where(mask == 255)
    if ys.size == 0:
        return None

    y0, y1 = int(np.min(ys)), int(np.max(ys))
    x0, x1 = int(np.min(xs)), int(np.max(xs))

    return gray[y0:y1 + 1, x0:x1 + 1]


def _enhance(region):
    """
    Stage 3 – up-scale, threshold, and morphologically clean the plate crop.
    """
    # Upscale 3× for better OCR
    region = cv2.resize(region, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

    # OTSU binarisation
    _, binary = cv2.threshold(region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Light morphological cleanup
    kernel = np.ones((1, 1), np.uint8)
    binary = cv2.dilate(binary, kernel, iterations=1)
    binary = cv2.erode(binary, kernel, iterations=1)

    return binary


def _run_ocr(img, psm=8):
    """
    Stage 4 – pytesseract with whitelist restricted to plate characters.
    """
    config = (
        f"--oem 3 --psm {psm} "
        "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    )
    raw = pytesseract.image_to_string(img, config=config)
    return re.sub(r"[^A-Z0-9]", "", raw.upper())


def _confidence(img, psm=8):
    """
    Compute average confidence from pytesseract detailed output.
    Falls back to 0.5 on any error.
    """
    try:
        config = (
            f"--oem 3 --psm {psm} "
            "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        )
        data = pytesseract.image_to_data(
            img, config=config, output_type=pytesseract.Output.DICT
        )
        confs = [int(c) for c in data["conf"] if str(c) != "-1" and int(c) > 0]
        return round(sum(confs) / len(confs) / 100, 2) if confs else 0.5
    except Exception:
        return 0.5


# ── Public API ────────────────────────────────────────────────────────────────

def process_image(image_bytes: bytes):
    """
    Full pipeline: bytes → { plateNumber, confidence, vehicleType } or None.
    """
    try:
        img = _to_bgr(image_bytes)
        if img is None:
            return None

        gray = _preprocess(img)

        # --- Attempt 1: detect plate region then OCR ---
        plate_region = _locate_plate(gray)
        if plate_region is not None:
            enhanced = _enhance(plate_region)
            text = _run_ocr(enhanced, psm=8)
            conf = _confidence(enhanced, psm=8)

            # Fallback PSM if result too short
            if len(text) < 3:
                text_alt = _run_ocr(enhanced, psm=7)
                conf_alt = _confidence(enhanced, psm=7)
                if len(text_alt) >= len(text):
                    text, conf = text_alt, conf_alt
        else:
            enhanced = _enhance(gray)
            text = _run_ocr(enhanced, psm=6)
            conf = _confidence(enhanced, psm=6)

        # Last resort – try on the raw gray
        if len(text) < 3:
            raw_enhanced = _enhance(gray)
            text_fallback = _run_ocr(raw_enhanced, psm=11)
            if len(text_fallback) >= len(text):
                text = text_fallback
                conf = _confidence(raw_enhanced, psm=11)

        if len(text) < 2:
            return None

        return {
            "plateNumber": text[:12],
            "confidence": min(max(conf, 0.0), 1.0),
            "vehicleType": "Unknown",
        }

    except Exception as exc:
        print(f"[OCR Engine] Error: {exc}")
        return None
