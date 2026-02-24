import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

class FinetunedModel:
    def __init__(self, checkpoint_name=None):
        checkpoint_name = checkpoint_name or os.getenv("MODEL_CHECKPOINT", "checkpoint-1512")
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, "model", "baseline", checkpoint_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(path)
        self.tokenizer = AutoTokenizer.from_pretrained(path)
        self.model.eval()
        self.id2label = {0: "Informative", 1: "Misinformative"}

    def predict_confidence(self, text: str):
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            probs = torch.softmax(self.model(**inputs).logits, dim=1).cpu().numpy()[0]
            label_id = int(probs.argmax())
            return {
                "label": self.id2label[label_id],
                "confidence": float(probs[label_id]),
                "probabilities": {self.id2label[0]: float(probs[0]), self.id2label[1]: float(probs[1])}
            }
