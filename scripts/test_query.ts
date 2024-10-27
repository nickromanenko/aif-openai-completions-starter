import { searchIndex } from '../services/embedder.service';
import { embed } from '../services/openai.service';

async function main() {
    const query = 'Error 1001';
    const embeddingResult = await embed(query);

    const vector = embeddingResult[0].embedding;

    const matches = (await searchIndex(vector)).matches.filter(match => match.score > 0.5);

    for (const match of matches) {
        console.log(match.metadata.content);
    }
}

main().catch(console.error);
