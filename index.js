import { db } from "./db/index.js";
import { todostable } from "./db/schema.js";
import { eq, ilike } from "drizzle-orm";
import OpenAI from "openai";
import dotenv from "dotenv";
import readlineSync from "readline-sync";

const OPENAI_API_KEY = dotenv.config().parsed.OPENAI_API_KEY;

// Tools
console.log(todostable);
async function getAllTools() {
  return await db.select().from(todostable);
}

async function createTodo(todo) {
  console.log(`table for todo `);
  console.log(todostable.id);
  console.log(`Todo ${todo}`);
  const [result] = await db
    .insert(todostable)
    .values({ todo: todo })
    .returning({ id: todostable.id });
  return result.id;
}
async function searchTodo(search) {
  return await db
    .select()
    .from(todostable)
    .where(ilike(todostable.todo, `%${search}%`));
}
async function deleteTodo(id) {
  await db.delete(todostable).where(eq(todostable.id, id));
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const SYSTEM_PROMPT = `

You are an AI TO-DO assistant with START, PLAN, ACTION, Observation and Output State. Wait for the user prompt and first PLAN using available tools. After Planning, take the action with appropriate tools and wait for observation based on Action. Once you get the observation, return AI response JSON based on START prompt and observations.

You can manage tasks by adding, viewing,updating, and deleting them.You mist strictly follow the JSON output format.

Todo DB Schema:
- id: integer and primary key
-todo: string and not null
- createdAt: timestamp and default now
- updatedAt: timestamp and on update now

Available Tools
- getAllTodos(): Retturn all todos in the database.
- createTodo(todo:string): Create a new todo in the database and takes todo as a string and return the id.
- searchTodo(query:string): Search for all todos matching query in the database.
- deleteTodo(id:string): Delete a todo by Id from the database.

Example:
START
{"type":"user","user":"create a new todo for shopping groceries"}
{"type":"plan","plan":"I will try to get more context on what user needs to shop."}
{"type":"output","output":"can you please tell me what you want to buy?"}
{"type":"user","user":"i want to buy milk and chocolate"}   
{"type":"plan","plan":"I will use the createTodo tool to create a new todo in DB"}
{"type":"action","function":"createTodo","input":" Shopping for milk and chocolate"}
{"type":"observation","observation":"2"}
{"type":"output","output":"Todo created successfully"}

`;

const tools = {
  getAllTodos: getAllTools,
  createTodo: createTodo,
  deleteTodo: deleteTodo,
  searchTodo: searchTodo,
};

const messages = [{ role: "system", content: SYSTEM_PROMPT }];

while (true) {
  const query = readlineSync.question("Enter your query: ");
  const userMessage = {
    type: "user",
    user: query,
  };
  messages.push({ role: "user", content: JSON.stringify(userMessage) });
  while (true) {
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
    });
    console.log("-------START AI RESPONSE-------");
    const result = chat.choices[0].message.content;
    console.log(result);
    console.log("-------END AI RESPONSE-------");
    console.log("\n\n");
    messages.push({ role: "assistant", content: result });
    const call = JSON.parse(result);
    if (call.type === "output") {
      console.log(`BOT: ${call.output}`);
      break;
    } else if (call.type === "action") {
      const fn = tools[call.function];
      //console.log(`Calling function: ${call.action}`);
      //console.log(`Calling function: ${call.city}`);
      const observation = await fn(call.input);
      //console.log(`Observation: ${observation[0]}`);
      const obs = { type: "observation", observation: observation };

      messages.push({ role: "developer", content: JSON.stringify(obs) });
    }
  }
}
