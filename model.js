import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  temperature: 0.3,
  openAIApiKey: 'EMPTY',
  model: 'llama3.1',
  configuration: {
    baseURL: 'http://localhost:11434/v1'
  }
});

export default model;