const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'ORBI_PLANT_MASTER_DATABASE_v1.0.json');

// If the json file exists at src/data or root, we load it, or we embed the json content
let rawData;
if (fs.existsSync(jsonPath)) {
  rawData = fs.readFileSync(jsonPath, 'utf8');
} else {
  // Check root
  const rootJsonPath = path.join(__dirname, '..', 'ORBI_PLANT_MASTER_DATABASE_v1.0.json');
  if (fs.existsSync(rootJsonPath)) {
    rawData = fs.readFileSync(rootJsonPath, 'utf8');
  }
}

let plants = [];
if (rawData) {
  plants = JSON.parse(rawData).plants;
}

console.log('Found plants in JSON:', plants.length);
