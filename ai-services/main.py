import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/api/analyze/quality")
async def analyze_quality(file: UploadFile = File(...)):
    try:
        # 1. Read raw incoming network bytes into memory safely
        contents = await file.read()
        if not contents:
            return JSONResponse(status_code=400, content={"error": "Empty file uploaded."})
            
        np_image = np.frombuffer(contents, np.uint8)
        
        # 2. Decode with IMREAD_UNCHANGED to catch transparent PNG/screenshots
        image = cv2.imdecode(np_image, cv2.IMREAD_UNCHANGED)
        
        # Explicit validation checkpoint before checking shapes
        if image is None:
            return JSONResponse(
                status_code=400,
                content={"error": "OpenCV failed to decode image. Format may be unsupported or corrupt."}
            )
            
        # 3. Dynamic Channel Parsing to avoid shape assertion failures
        if len(image.shape) == 2:
            # Already grayscale
            gray_image = image
        elif len(image.shape) == 3:
            channels = image.shape[2]
            if channels == 4:
                gray_image = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
            elif channels == 3:
                gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            return JSONResponse(status_code=400, content={"error": "Unsupported image dimensions."})

        # 4. Compute Image Analytics
        # Blur check using Laplacian Variance
        blur_score = float(cv2.Laplacian(gray_image, cv2.CV_64F).var())
        is_blurry = blur_score < 100.0
        
        # Exposure check using average pixel brightness
        avg_brightness = float(np.mean(gray_image))
        if avg_brightness < 40:
            exposure = "underexposed"
        elif avg_brightness > 220:
            exposure = "overexposed"
        else:
            exposure = "normal"
            
        passed_quality = (not is_blurry) and (exposure == "normal")

        # 5. Return success schema
        return {
            "is_blurry": is_blurry,
            "blur_score": round(blur_score, 2),
            "exposure": exposure,
            "passed_quality": passed_quality
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Internal processing crash: {str(e)}"})