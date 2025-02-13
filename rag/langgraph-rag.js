import model from '../model.js';
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { pull } from "langchain/hub";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


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

// Define prompt for question-answering
const promptTemplate = await pull('rlm/rag-prompt');


//Define state for the application
const InputStateAnnotation = Annotation.Root({
  question: Annotation
});

const StateAnnotation = Annotation.Root({
  question: Annotation,
  context: Annotation,
  answer: Annotation
});

//Define the application steps
const retrieve = async function(state) {
  const retrievedDocs = await vectorStore.similaritySearch(state.question);
  return {
    context: retrievedDocs
  };
}

const generate = async function(state) {
  const docsContent = state.context.map(docs => docs.pageContent).join('\n');
  const messages = await promptTemplate.invoke({
    question: state.question,
    context: docsContent
  });
  const response = await model.invoke(messages);
  return { answer: response.content };
}

//Compile the applcation and test
const graph = new StateGraph(StateAnnotation)
  .addNode('retrieve', retrieve)
  .addNode('generate', generate)
  .addEdge(START, 'retrieve')
  .addEdge('retrieve', 'generate')
  .addEdge('generate', END)
  .compile();

let inputs = {
  question: 'What is task decomposition'
};

const result = await graph.invoke(inputs);
console.log(result.answer);