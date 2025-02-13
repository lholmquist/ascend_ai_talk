import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage
} from '@langchain/core/messages';
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import model from '../model.js';
import retrieve from './tools/retrieval-tool.js';

//Step 1: Generate an AI Message that may include a tool-call to be sent
const queryOrRespond = async function(state) {
  const llmWithTools = model.bindTools([retrieve]);
  const response = await llmWithTools.invoke(state.messages);
  return { messages: [response] };
}

// Step 2: Execute the retrieval.
const tools = new ToolNode([retrieve]);

// Step 3 Generate a response using the rretrieved content
const generate = async function(state) {
  let recentToolMessages = [];
  for (let i = state['messages'].length - 1; i >= 0; i--) {
    let message = state['messages'][i];
    if (message instanceof ToolMessage) {
      recentToolMessages.push(message);
    } else {
      break;
    }
  }

  let toolMessages = recentToolMessages.reverse();

  //Format into Prompt
  const docsContent = toolMessages.map((doc) => doc.content).join('\n');
  const systemMesssageContent =
    'You are an assistant for question-answering tasks. ' +
    'Use the following pieces of retrieved context to answer ' +
    'the question. If you don\'t know the answer, say that you ' +
    'don\'t know. Use three sentences maximum and keep the ' +
    'answer concise.' +
    '\n\n' +
    `${docsContent}`;

  const conversationMessage = state.messages.filter(
    (message) =>
      message instanceof HumanMessage ||
      message instanceof SystemMessage ||
      (message instanceof AIMessage && message.tool_calls.length === 0)
  );

  const prompt = [
    new SystemMessage(systemMesssageContent),
    ...conversationMessage
  ];

  //Run
  const response = await model.invoke(prompt);
  return { messages: [response] };
}

const graphBuilder = new StateGraph(MessagesAnnotation)
  .addNode('queryOrRespond', queryOrRespond)
  .addNode('tools', tools)
  .addNode('generate', generate)
  .addEdge('__start__', 'queryOrRespond')
  .addConditionalEdges('queryOrRespond', toolsCondition, {
    __end__: '__end__',
    tools: 'tools'
  })
  .addEdge('tools', 'generate')
  .addEdge('generate', '__end__');

const graph = graphBuilder.compile();



import { BaseMessage, isAIMessage } from "@langchain/core/messages";

// Just for shits
const prettyPrint = (message) => {
  let txt = `[${message._getType()}]: ${message.content}`;
  if ((isAIMessage(message) && message.tool_calls?.length) || 0 > 0) {
    const tool_calls = (message)?.tool_calls
      ?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
      .join("\n");
    txt += ` \nTools: \n${tool_calls}`;
  }
  console.log(txt);
};

let inputs1 = {
  messages: [
    {
      role: 'user',
      content: 'my name is luke'
    }
  ]
};

const result = await graph.invoke(inputs1);
console.log(result.messages[result.messages.length - 1].content);

// for await (const step of await graph.stream(inputs1, {
//   streamMode: 'values'
// })) {
//   const lastMessage = step.messages[step.messages.length - 1];
//   prettyPrint(lastMessage);
//   console.log('-----\n');
// }

let inputs2 = {
  messages: [
    {
      role: 'user',
      content: 'What is Task Decomposition?'
    }
  ]
}

for await (const step of await graph.stream(inputs2, {
  streamMode: 'values'
})) {
  const lastMessage = step.messages[step.messages.length - 1];
  prettyPrint(lastMessage);
  // console.log(lastMessage);
  console.log('-----\n');
}