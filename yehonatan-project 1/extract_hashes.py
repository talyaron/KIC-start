import json

items_to_find = [
    "AK-47 | Ice Coaled",
    "USP-S | Printstream",
    "Desert Eagle | Printstream",
    "AK-47 | Legion of Anubis",
    "AWP | Chromatic Aberration",
    "P2000 | Gnarled",
    "SSG 08 | Mainframe 001",
    "P250 | Asiimov",
    "UMP-45 | Primal Saber",
    "M4A1-S | Chantico's Fire",
    "PP-Bizon | Judgement of Anubis",
    "SSG 08 | Ghost Crusader",
    "Galil AR | Firefight",
    "CZ75-Auto | Red Astor",
    "SG 553 | Atlas",
    "Dual Berettas | Ventilators",
    "P2000 | Oceanic",
    "MP9 | Bioleak",
    "M249 | Spectre"
]

cases_to_find = [
    "Chroma 3 Case",
    "Fracture Case",
    "Recoil Case"
]

results = {}

print("Scanning skins.json...")
try:
    with open('skins.json', 'r', encoding='utf-8') as f:
        skins_data = json.load(f)
        for skin in skins_data:
            name = skin.get('name')
            if name in items_to_find:
                results[name] = skin.get('image')
except Exception as e:
    print(f"Error reading skins.json: {e}")

print("Scanning crates.json...")
try:
    with open('crates.json', 'r', encoding='utf-8') as f:
        crates_data = json.load(f)
        for crate in crates_data:
            name = crate.get('name')
            if name in cases_to_find:
                results[name] = crate.get('image')
except Exception as e:
    print(f"Error reading crates.json: {e}")

print("\n--- RESULTS ---")
for name, img in results.items():
    # Attempt to extract the hash part if it's an Akamai URL
    hash_part = img
    if "economy/image/" in img:
        hash_part = img.split("economy/image/")[1]
    print(f"{name}: {hash_part}")
