import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import model from '../model.js';

const prompt = ChatPromptTemplate.fromTemplate(
  `Extract information from the following phrase.
  Formatting Instructions: {format_instructions}
  Phrase: {phrase}`
);

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  name: 'The name of the person',
  age: 'The age of the person'
});

const chain = prompt.pipe(model).pipe(parser);

const response = await chain.invoke({
  phrase: 'Luke is 44 years old',
  format_instructions: parser.getFormatInstructions()
});

console.log(response);