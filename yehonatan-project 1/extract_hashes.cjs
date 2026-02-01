const fs = require('fs');

const items_to_find = [
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
];

const cases_to_find = [
    "Chroma 3 Case",
    "Fracture Case",
    "Recoil Case"
];

const results = {};

console.log("Scanning skins.json...");
try {
    const skinsData = JSON.parse(fs.readFileSync('skins.json', 'utf8'));
    skinsData.forEach(skin => {
        if (items_to_find.includes(skin.name)) {
            results[skin.name] = skin.image;
        }
    });
} catch (e) {
    console.error(`Error reading skins.json: ${e}`);
}

console.log("Scanning crates.json...");
try {
    const cratesData = JSON.parse(fs.readFileSync('crates.json', 'utf8'));
    cratesData.forEach(crate => {
        if (cases_to_find.includes(crate.name)) {
            results[crate.name] = crate.image;
        }
    });
} catch (e) {
    console.error(`Error reading crates.json: ${e}`);
}

console.log("\n--- RESULTS ---");
for (const [name, img] of Object.entries(results)) {
    let hash_part = img;
    if (img && img.includes("economy/image/")) {
        hash_part = img.split("economy/image/")[1];
    }
    console.log(`${name}: ${hash_part}`);
}
