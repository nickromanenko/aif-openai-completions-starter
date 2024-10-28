import 'dotenv/config';
import { searchIndex } from '../services/embedder.service';
import { embed } from '../services/openai.service';

async function main() {
    const query = 'Error Code 37037';
    const embeddingResult = await embed(query);

    const vector = embeddingResult[0].embedding;
    const matches = (await searchIndex(vector)).matches;

    console.log('Matches:', matches);
}

main().catch(error => console.error);
