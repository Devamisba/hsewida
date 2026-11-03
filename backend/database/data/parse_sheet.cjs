const fs = require('fs');
const path = require('path');

// Read the raw fetched CSV content
const rawPath = 'C:\\Users\\W I N D O W S\\.gemini\\antigravity\\brain\\32b9c1f4-1968-46b6-a2df-65a58ace5fa7\\.system_generated\\steps\\8\\content.md';
const content = fs.readFileSync(rawPath, 'utf8');

// Find the CSV start
const lines = content.split(/\r?\n/);
const headerIdx = lines.findIndex(l => l.includes('Area Umum'));
if (headerIdx === -1) {
  console.error('Header not found!');
  process.exit(1);
}

const csvLines = lines.slice(headerIdx);

// Function to parse a CSV line properly handling quotes
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// Robust coordinate parser
function parseCoordinates(coordStr) {
  if (!coordStr) return { lat: null, lng: null, raw: coordStr };
  let s = coordStr.replace(/[()]/g, '').trim();

  // Match lat (-7.xxx, -7,xxx, -764xxx) and lng (112.xxx, 112,xxx)
  const regex = /(-?7[.,\d]+)[\s,]+(112[.,\d]+)/;
  const match = s.match(regex);
  if (match) {
    let latPart = match[1];
    let lngPart = match[2];

    if (latPart.startsWith('-764') && !latPart.startsWith('-7.')) {
      latPart = '-7.' + latPart.slice(2);
    } else {
      latPart = latPart.replace(',', '.');
    }
    lngPart = lngPart.replace(',', '.');

    const lat = parseFloat(latPart);
    const lng = parseFloat(lngPart);
    return {
      lat: isNaN(lat) ? null : Number(lat.toFixed(6)),
      lng: isNaN(lng) ? null : Number(lng.toFixed(6)),
      raw: coordStr
    };
  }

  return { lat: null, lng: null, raw: coordStr };
}

// Columns definition for the 4 zones:
const zones = [
  { name: 'Area Umum', startCol: 0 },
  { name: 'Area Factory 1', startCol: 7 },
  { name: 'Area Factory 2 & Workshop', startCol: 14 },
  { name: 'Area Warehouse', startCol: 21 },
];

const extracted = [];

for (let rowIdx = 2; rowIdx < csvLines.length; rowIdx++) {
  const line = csvLines[rowIdx];
  if (!line.trim()) continue;
  const cols = parseCSVLine(line);

  for (const zone of zones) {
    const no = cols[zone.startCol] ? cols[zone.startCol].trim() : '';
    const code = cols[zone.startCol + 1] ? cols[zone.startCol + 1].trim() : '';
    const locName = cols[zone.startCol + 2] ? cols[zone.startCol + 2].trim() : '';
    const type = cols[zone.startCol + 3] ? cols[zone.startCol + 3].trim() : '';
    const coordRaw = cols[zone.startCol + 4] ? cols[zone.startCol + 4].trim() : '';
    const keterangan = cols[zone.startCol + 6] ? cols[zone.startCol + 6].trim() : '';

    if (code && /^[A-F]-\d+$/i.test(code)) {
      const coord = parseCoordinates(coordRaw);
      extracted.push({
        area: zone.name,
        no: parseInt(no) || extracted.length + 1,
        code: code.toUpperCase(),
        location_name: locName,
        type: type.replace('₂', '2'),
        latitude: coord.lat,
        longitude: coord.lng,
        raw_coordinates: coordRaw,
        keterangan: keterangan,
        is_verified: keterangan.toLowerCase() === 'benar'
      });
    }
  }
}

console.log('Total extracted APAR items:', extracted.length);
const verifiedCount = extracted.filter(x => x.is_verified).length;
console.log('Verified ("Benar"):', verifiedCount);
console.log('Unverified / empty keterangan:', extracted.length - verifiedCount);

const outDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'apar_fix_betul.json'), JSON.stringify(extracted, null, 2), 'utf8');

const csvRows = [
  'area,no,code,location_name,type,latitude,longitude,raw_coordinates,keterangan,is_verified'
];
for (const item of extracted) {
  csvRows.push([
    `"${item.area}"`,
    item.no,
    `"${item.code}"`,
    `"${item.location_name.replace(/"/g, '""')}"`,
    `"${item.type}"`,
    item.latitude,
    item.longitude,
    `"${(item.raw_coordinates || '').replace(/"/g, '""')}"`,
    `"${item.keterangan}"`,
    item.is_verified ? 1 : 0
  ].join(','));
}
fs.writeFileSync(path.join(outDir, 'apar_fix_betul.csv'), csvRows.join('\n'), 'utf8');
console.log('Successfully written to apar_fix_betul.json and apar_fix_betul.csv');
