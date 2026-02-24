import fastapi
from ocr.EasyOCR import EasyOCR
from model import FinetunedModel
from preprocessing.preprocess import normalize_text
import uvicorn

app = fastapi.FastAPI()
model = FinetunedModel()



@app.post("/predict_text")
def predict_text(text: str):
    return model.predict_confidence(text)


@app.post("/predict_image")
def predict_image(image_url: str):
    ocr = EasyOCR()
    if not ocr.check_file_format(image_url):
        return {"error": "Invalid file format."}
    
    ocr_results = ocr.read_text(image_url)
    text = " ".join([result[1] for result in ocr_results])
    normalized_text = normalize_text(text)
    prediction = model.predict_confidence(normalized_text)
    return {
        "extracted_text": text,
        "normalized_text": normalized_text,
        "prediction": prediction
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)