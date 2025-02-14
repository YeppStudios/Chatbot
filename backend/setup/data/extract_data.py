import fitz
import pathlib
import re
import os

ROOT_PATH = pathlib.Path(
    __file__
).parent.parent.parent.absolute()  # Path to the root of the project

INPUT_FOLDER_PATH = f"{ROOT_PATH}/setup/data/raw"
INPUT_FILE_PATH = f"{ROOT_PATH}/setup/data/raw/BULWARY_Karty mieszkan.pdf"
OUTPUT_FOLDER_PATH = f"{ROOT_PATH}/setup/data/extracted"


def run_extraction(output_folder_path, input_folder_path=None, input_file_path=None):
    """Run extraction of text from pdf files

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
        file_name = pathlib.Path(input_file_path).stem.replace(' ', '_')
        result = list(extract_from_pdf_file(input_file_path))
        output_file_path = f"{output_folder_path}/{file_name}_extracted..txt"

        with open(output_file_path, "w") as file_cleaned:
            file_cleaned.write(" ".join(result))
            print(f"Extracted text from {input_file_path} to {output_file_path}")
    else:
        path = pathlib.Path(input_folder_path)

        for file_path in path.iterdir():
            result = list(extract_from_pdf_file(file_path))
            output_file_path = f"{output_folder_path}/{file_path.stem.replace(' ', '_')}_extracted.txt"

            with open(output_file_path, "w") as file_cleaned:
                file_cleaned.write(" ".join(result))
                print(f"Extracted text from {file_path} to {output_file_path}")


def extract_from_pdf_file(file_path):
    """Extract text from a pdf file

    :param file_path: Path to the source pdf file
    :yield: Extracted text
    """
    doc = fitz.open(file_path)

    for page in doc:
        text = page.get_text()
        text = (
            text.replace("\n", " ")
            .replace("\n\n", "\n")
            .replace("\n\n\n", "\n")
            .strip()
        )
        text = re.sub(r"(?<=\S)\s\n", " ", text, flags=re.MULTILINE)
        text = re.sub(r"(\s\n)+", " ", text, flags=re.MULTILINE)
        text = re.sub(r"(\s){3,}", " ", text, flags=re.MULTILINE)

        yield text


run_extraction(OUTPUT_FOLDER_PATH, input_folder_path=INPUT_FOLDER_PATH)
