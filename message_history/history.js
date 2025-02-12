import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatMessageHistory } from 'langchain/memory';
import model from '../model.js';

const prompt = ChatPromptTemplate.fromMessages([
  [ 'system', 'You are an assistant.  Your answers should be short' ],
  new MessagesPlaceholder('history'),
  [ 'human', '{input}' ]
]);

const parser = new StringOutputParser();

const chain = prompt.pipe(model).pipe(parser);

const sessions = {};

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (sessionId) => {
    if (sessions[sessionId] === undefined) {
      sessions[sessionId] = new ChatMessageHistory();
    }
    // console.log('in the get function');
    // console.log(sessions[sessionId]);
    return sessions[sessionId];
  },
  inputMessagesKey: 'input',
  historyMessagesKey: 'history',
});

console.log('calling response1');
const response1 = await chainWithHistory.invoke(
  {
    input: 'My name is Luke'
  },
  {
    configurable: {
      sessionId: 'funtimes'
    }
  }
);

console.log('Response 1: ', response1);

console.log('calling response2');
const response2 = await chainWithHistory.invoke(
  {
    input: 'What is my name'
  },
  {
    configurable: {
      sessionId: 'funtimes'
    }
  }
);

console.log('Response 2: ', response2);

console.log('All Sessions:');
console.log(sessions);