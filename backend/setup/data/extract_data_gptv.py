import fitz
from openai import OpenAI
from io import BytesIO
import base64
from PIL import Image
import pathlib
import os
import dotenv
import tempfile

dotenv.load_dotenv()

ROOT_PATH = pathlib.Path(
    __file__
).parent.parent.parent.absolute()  # Path to the root of the project

INPUT_FOLDER_PATH = f"{ROOT_PATH}/setup/data/raw"
INPUT_FILE_PATH = f"{ROOT_PATH}/setup/data/raw/OPIS TERENU.pdf"
OUTPUT_FOLDER_PATH = f"{ROOT_PATH}/setup/data/extracted"


client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def run_extraction(output_folder_path, input_folder_path=None, input_file_path=None):
    """Run extraction of text from pdf files using GPT-4 Vision

    :param output_folder_path: The path to the folder where the extracted text will be saved
    :param input_folder_path: The path to the folder with pdf files to extract text from
    :param input_file_path: The path to the pdf file to extract text from
    :raises ValueError
    """
    if input_folder_path is None and input_file_path is None:
        raise ValueError("You must provide either input_folder_path or input_file_path")

    if not os.path.exists(OUTPUT_FOLDER_PATH):
        os.makedirs(OUTPUT_FOLDER_PATH)

    if input_file_path:
        doc = fitz.open(INPUT_FILE_PATH)

        with tempfile.TemporaryDirectory() as temp_dir:
            for image, page in extract_images_from_pdf(doc):
                image_path = os.path.join(temp_dir, f"page-{page.number}.png")

                image.save(image_path)

                img_uri = get_img_uri(image_path)
                res = analyze_image(img_uri)

                file_name = pathlib.Path(input_file_path).stem.replace(" ", "_")
                output_file_path = (
                    f"{output_folder_path}/{file_name}_gptv_extracted.txt"
                )

                with open(output_file_path, "a+") as file_cleaned:
                    file_cleaned.write(res)

                print(
                    f"Extracted text from {input_file_path} page {page.number} {output_file_path}"
                )

            print(f"Extracted text from {input_file_path} to {output_file_path}")
    else:
        path = pathlib.Path(input_folder_path)

        for file_path in path.iterdir():
            doc = fitz.open(file_path)

            with tempfile.TemporaryDirectory() as temp_dir:
                for image, page in extract_images_from_pdf(doc):
                    image_path = os.path.join(temp_dir, f"page-{page.number}.png")
                    image.save(image_path)

                    img_uri = get_img_uri(image_path)
                    res = analyze_image(img_uri)

                    file_name = pathlib.Path(input_file_path).stem.replace(" ", "_")
                    output_file_path = (
                        f"{output_folder_path}/{file_name}_gptv_extracted.txt"
                    )

                    with open(output_file_path, "w") as file_cleaned:
                        file_cleaned.write(res)
                        print(
                            f"Extracted text from {input_file_path} to {output_file_path}"
                        )


def extract_images_from_pdf(doc):
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        yield (pix, page)


def get_img_uri(img_path):
    img = Image.open(img_path)
    buffer = BytesIO()
    img.save(buffer, format="jpeg")
    base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")
    data_uri = f"data:image/jpeg;base64,{base64_image}"
    return data_uri


def analyze_image(img_url):

    system_prompt = """You will be provided with an image of a pdf page or a slide. Your goal is to OCR all the text and content you see.

                    The content of the image is in Polish language, so please make sure to provide the output in Polish.

                    Please provide very precise results. 
                    If some element in table dosn't match structure and is max 2 characters, you can ignore it.

                    If there is a table, try to read the table column names and for each row provide the apropriate column name and value.
                    """

    response = client.chat.completions.create(
        model="gpt-4-vision-preview",
        temperature=1,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": img_url,
                    },
                ],
            },
        ],
        max_tokens=3000,
        top_p=0.1,
    )

    return response.choices[0].message.content


run_extraction(OUTPUT_FOLDER_PATH, input_file_path=INPUT_FILE_PATH)
