import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { upsertToIndex } from '../services/embedder.service';
import { embed } from '../services/openai.service';
import { splitTextIntoChunks } from '../services/utilities.service';

async function main() {
    const contents = readFileSync(join(__dirname, './../kdb.txt'), 'utf8');
    const chunks = splitTextIntoChunks(contents);

    let i = 0;
    const len = chunks.length;
    const data = [];
    for (const chunk of chunks) {
        i++;
        console.log(`Processing chunk ${i} of ${len}`);
        const result = await embed(chunk);
        console.log(result);

        data.push({
            id: uuidv4(),
            values: result[0].embedding,
            metadata: {
                content: chunk,
            },
        });
    }

    console.log(data);

    await upsertToIndex(data);
}

main().catch(error => console.error);
