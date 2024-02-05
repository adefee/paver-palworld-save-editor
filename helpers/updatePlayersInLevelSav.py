import ijson
import json
import os
import argparse
from decimal import Decimal

def default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def process_json_files_in_folder(folder_path, character_data):
    # print(f"Processing folder: {folder_path}")
    for entry in os.listdir(folder_path):
        full_path = os.path.join(folder_path, entry)
        if os.path.isdir(full_path):
            # If the entry is a directory, recursively process it
            process_json_files_in_folder(full_path, character_data)
        elif entry.endswith('.json'):
            with open(full_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                character_data.append(data)
                # print(f"Processed file: {entry}")

def insert_into_large_json(large_json_path, small_jsons_folder, insertion_path):
    character_data = []

    for subfolder in os.listdir(small_jsons_folder):
        subfolder_path = os.path.join(small_jsons_folder, subfolder)
        if os.path.isdir(subfolder_path):
            process_json_files_in_folder(subfolder_path, character_data)

    if not character_data:
        print("No data found in small JSON files.")
        return

    with open(large_json_path, 'r', encoding='utf-8') as file:
        large_json_data = json.load(file)

    insertion_point = large_json_data
    path_parts = insertion_path.split('.')
    for part in path_parts[:-1]:
        insertion_point = insertion_point[part]

    insertion_point[path_parts[-1]] = character_data

    with open(large_json_path, 'w', encoding='utf-8') as file:
        json.dump(large_json_data, file, default=default, indent=2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Insert data from small JSON files into a specific point in a large JSON file.')
    parser.add_argument('large_json_path', type=str, help='Path to the large JSON file')
    parser.add_argument('small_jsons_folder', type=str, help='Folder containing subfolders with small JSON files')
    parser.add_argument('insertion_path', type=str, help='Insertion path within the large JSON file')

    args = parser.parse_args()

    insert_into_large_json(args.large_json_path, args.small_jsons_folder, args.insertion_path)
