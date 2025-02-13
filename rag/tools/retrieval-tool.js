import { z } from 'zod';
import { tool } from '@langchain/core/tools';

import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const retrieveSchema = z.object({ query: z.string() });

// Instantiate Embeddings function
const embeddings = new HuggingFaceTransformersEmbeddings();
// const embeddings = new OpenAIEmbeddings({
//   model: 'text-embedding-3-large'
// });

const vectorStore = new MemoryVectorStore(embeddings);

// Load and chunk contents of blog
const pTagSelector = "p";
const cheerioLoader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/",
  {
    selector: pTagSelector
  }
);

const docs = await cheerioLoader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});

const allSplits = await splitter.splitDocuments(docs);

// Index Chunks
await vectorStore.addDocuments(allSplits);


const retrieve = tool(
  async function ({ query }) {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const serialized = retrievedDocs
      .map((doc) => `Source ${doc.metadata.source}\nContent: ${doc.pageContent}`)
      .join('\n');
    return [serialized, retrievedDocs];
  },
  {
    name: 'retrieve',
    description: 'Retrieve information related to a query',
    schema: retrieveSchema,
    responseFormat: 'content_and_artifact'
  }
);

export default retrieve;