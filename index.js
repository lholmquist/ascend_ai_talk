import { ChatPromptTemplate } from '@langchain/core/prompts';
import model from './model.js';

const prompt = ChatPromptTemplate.fromMessages([
  [ 'system', 'Translate the following from English to {language}' ],
  [ 'human', '{word}' ]
]);

const chain = prompt.pipe(model);

const response = await chain.invoke({
  language: 'French',
  word: 'hi'
});

console.log(response);


