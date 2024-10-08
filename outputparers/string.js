import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import model from '../model.js';

const prompt = ChatPromptTemplate.fromMessages([
  [ 'system', 'Translate the following from English to {language}' ],
  [ 'human', '{word}' ]
]);

const parser = new StringOutputParser();

const chain = prompt.pipe(model).pipe(parser);

const response = await chain.invoke({
  language: 'French',
  word: 'What is your name?'
});

console.log(response);