import model from '../model.js';

import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver
} from '@langchain/langgraph';

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You talk like a pirate. Answer all questions to the best of your ability.",
  ],
  new MessagesPlaceholder('messages')
]);

const runnableChain = promptTemplate.pipe(model);

const callModel = async function(state) {
  const response = await runnableChain.invoke(state);
  return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('model', callModel)
  .addEdge(START, 'model')
  .addEdge('model', END);

const memory = new MemorySaver();
const app = workflow.compile({checkpointer: memory});

const config = {
  configurable: {
    thread_id: 'funtimes'
  }
};

const input = {
  messages: [{ role: 'user', content: 'My name is Luke' }]
}

console.log('calling response1');
const response1 = await app.invoke(input, config);

console.log('Response 1: ', response1.messages[response1.messages.length - 1]);

console.log('calling response2');
const response2 = await app.invoke({
  messages: [
    {
      role: 'user',
      content: 'What is my name'
    }
  ]
}, config);

console.log('Response 2: ', response2.messages[response2.messages.length - 1]);

console.log('All Sessions:');
const currentState = await app.getState(config);
console.log(currentState.values);