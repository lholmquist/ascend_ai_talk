import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  temperature: 0.9,
  openAIApiKey: 'EMPTY',
  modelName: 'mistral'
}, {
  baseURL: 'http://localhost:8000/v1'
});

export default model;