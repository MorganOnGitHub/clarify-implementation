import easyocr
import os

class EasyOCR:
    def __init__(self, languages=['en']):
        self.reader = easyocr.Reader(languages)

    def check_file_format(self, file_path):
        allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
        _, ext = os.path.splitext(file_path)
        return ext.lower() in allowed_extensions

    def read_text(self, image):
        results = self.reader.readtext(image)
        return results


# if __name__ == "__main__":
    
#     reader = EasyOCR()
#     image_dir = 'examples/'
#     for filename in os.listdir(image_dir):
#         image_path = os.path.join(image_dir, filename)
#         results = reader.read_text(image_path)
#         for result in results:
#             if not reader.check_file_format(image_path):
#                 print("Invalid file format.")
#                 break
#             else:
#                 print(result)