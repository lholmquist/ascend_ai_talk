import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import model from '../model.js';


/**
 * Note that the descriptions here are crucial, as they will be passed along
 * to the model along with the class name.
 */
const calculatorSchema = z.object({
  operation: z
    .enum(["add", "subtract", "multiply", "divide"])
    .describe("The type of operation to execute."),
  number1: z.number().describe("The first number to operate on."),
  number2: z.number().describe("The second number to operate on."),
});

const calculatorTool = tool(
  async ({ operation, number1, number2 }) => {
    // Functions must return strings
    if (operation === "add") {
      return `${number1 + number2}`;
    } else if (operation === "subtract") {
      return `${number1 - number2}`;
    } else if (operation === "multiply") {
      return `${number1 * number2}`;
    } else if (operation === "divide") {
      return `${number1 / number2}`;
    } else {
      throw new Error("Invalid operation.");
    }
  },
  {
    name: "calculator",
    description: "Can perform mathematical operations.",
    schema: calculatorSchema,
  }
);

const llmWithTools = model.bindTools([calculatorTool]);

const messages = [new HumanMessage("What is 3 * 12? Also, what is 11 + 49?")];
const aiMessage = await llmWithTools.invoke(messages);

messages.push(aiMessage);

for (const toolCall of aiMessage.tool_calls) {
  const toolMessage = await calculatorTool.invoke(toolCall);
  messages.push(toolMessage);
}

console.log(messages);

const result = await llmWithTools.invoke(messages);
console.log(result);
