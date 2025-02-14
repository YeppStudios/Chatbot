# Setup Directory

This directory contains all the scripts necessary to set up the project, especially those related to data.

## Contents

- Scripts to extract data from PDF files.
- Scripts to import the extracted data into Pinecone database.

## Usage

To set up the project, follow these steps:

1. Navigate to the project directory in your terminal.

2. Create a virtual environment using Python 3.11. If you have Python 3.11 installed as `python3.11`, you can do this with the following command:

    ```bash
    python3.11 -m venv .venv
    ```

    This will create a new virtual environment in a directory called `.venv`.

3. Activate the virtual environment. On macOS and Linux, use:

    ```bash
    source .venv/bin/activate
    ```

    On Windows, use:

    ```cmd
    .venv\Scripts\activate
    ```

4. Once the virtual environment is activated, you should see `(.venv)` at the start of your terminal prompt. This indicates that the virtual environment is active. (If you open a new terminal window or restart your computer, you will need to reactivate the environment using this step.)

5. With the virtual environment active, install the required packages with:

    ```bash
    pip install -r setup/requirements.txt
    ```

Now you're ready to run the scripts in the `/setup` directory. Remember to keep the virtual environment active while you're running the scripts.

### Environment variables

This project uses Pinecone and OpenAI. The setup details for these services are stored in environment variables. Please ensure that these environment variables are correctly set up in your environment before running the main method.

### Import documents to Pinecone DB

The [main.py](setup/datastore/setup_datastore.py) file provides two options for importing documents:

1. **From a Single File:** You can import a document from a single file using the `import_single_file(file_path: str)` method. This method takes a string argument `file_path` which is the path to the file you want to import.

2. **From a Folder:** You can import documents from all files in a given folder using the `import_files_from_folder(folder_path: str)` method. This method takes a string argument `folder_path` which is the path to the folder containing the files you want to import.
