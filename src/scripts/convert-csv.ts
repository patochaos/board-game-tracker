import fs from 'fs';
import path from 'path';

function parseCSV(text: string) {
    const result: any[] = [];
    let rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuote && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            // Field separator
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuote) {
            // Line separator
            // Handle CRLF or LF
            if (char === '\r' && nextChar === '\n') {
                i++;
            }

            // Only push if row has content (skip empty lines)
            if (currentRow.length > 0 || currentField.length > 0) {
                currentRow.push(currentField);
                rows.push(currentRow);
            }

            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Push last row if exists
    if (currentRow.length > 0 || currentField.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    const headers = rows[0];

    for (let i = 1; i < rows.length; i++) {
        const rowValues = rows[i];
        if (rowValues.length !== headers.length) {
            // Basic recovery: if headers are fewer than values, ignore extras? 
            // Or if values are fewer, fill with empty?
            // For now, strict mapping based on available values
        }

        const row: any = {};
        headers.forEach((h, index) => {
            row[h] = rowValues[index];
        });
        result.push(row);
    }
    return result;
}

function escapeSql(str: string | undefined): string {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
}

function processCSV() {
    const csvPath = path.join(process.cwd(), 'collection.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    console.log('Parsing CSV...');
    const games = parseCSV(csvContent);
    console.log(`Found ${games.length} games.`);

    let sql = `-- Seed file from collection.csv\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    for (const game of games) {
        // Mapping based on CSV headers
        const bggId = game['objectid'];
        const name = game['objectname'];
        const year = game['yearpublished'];
        const minPlayers = game['minplayers'];
        const maxPlayers = game['maxplayers'];
        const playingTime = game['playingtime'];
        const avgRating = game['average'];

        // CSV from BGG export often misses images. We will set them to NULL.
        // If the objectid is missing, skip
        if (!bggId) continue;

        const insert = `INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating)
VALUES (
  ${bggId},
  ${escapeSql(name)},
  ${year ? parseInt(year) : 'NULL'},
  NULL,
  NULL,
  ${minPlayers ? parseInt(minPlayers) : 'NULL'},
  ${maxPlayers ? parseInt(maxPlayers) : 'NULL'},
  ${playingTime ? parseInt(playingTime) : 'NULL'},
  ${avgRating ? parseFloat(avgRating) : 'NULL'}
)
ON CONFLICT (bgg_id) DO NOTHING;\n`;

        sql += insert;
    }

    const outputPath = path.join(process.cwd(), 'seed_games.sql');
    fs.writeFileSync(outputPath, sql);
    console.log(`Success! SQL written to: ${outputPath}`);
}

processCSV();
