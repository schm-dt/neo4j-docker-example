import neo4j from "neo4j-driver";
import Cypher from "@neo4j/cypher-builder";
import OpenAI from "openai";
import inquirer from "inquirer";

require("dotenv").config();

const openai = new OpenAI();

async function main(query: string) {
  const URI = "neo4j://localhost";
  const USER = "neo4j";
  const PASSWORD = "password";

  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  const { cypher } = new Cypher.Raw(`MATCH (n)
    WITH n, gds.similarity.cosine($embedding, n.embedding) as similarity
    RETURN n.name AS name, n.age AS age, similarity
    ORDER BY similarity DESC
    LIMIT 5;`).build();

  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
    encoding_format: "float",
  });

  const result = await session.run(cypher, {
    embedding: embedding.data[0].embedding,
  });

  await session.close();
  await driver.close();

  return result.records.map((r) => r.toObject());
}

inquirer
  .prompt([{ type: "input", name: "query", message: "What is your query?" }])
  .then(async ({ query }) => {
    const result = await main(query);
    console.log("Your results:");
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
