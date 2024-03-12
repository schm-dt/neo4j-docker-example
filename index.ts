import neo4j from "neo4j-driver";
import Cypher from "@neo4j/cypher-builder";

import people from "./people.json";
import peopleEmbeddings from "./people-embeddings.json";

(async () => {
  const URI = "neo4j://localhost";
  const USER = "neo4j";
  const PASSWORD = "password";

  try {
    const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
    const session = driver.session();

    // CREATE INDEX
    {
      const { cypher, params } = new Cypher.Raw(
        `CREATE VECTOR INDEX persons IF NOT EXISTS
    FOR (m:Person)
    ON m.embedding
    OPTIONS {indexConfig: {
     \`vector.dimensions\`: 1536,
     \`vector.similarity_function\`: 'cosine'
    }}`
      ).build();

      await session.run(cypher, params);
      console.log("INDEX CREATED IF NOT EXISTED");
    }

    // INSERT NODES
    {
      const { cypher, params } = Cypher.concat(
        ...people.map((person) => {
          const node = new Cypher.Node({ labels: ["Entity"] });

          return new Cypher.Create(node)
            .set([node.property("id"), new Cypher.Param(person.id)])
            .set([node.property("name"), new Cypher.Param(person.name)])
            .set([node.property("age"), new Cypher.Param(person.age)]);
        })
      ).build();

      await session.run(cypher, params);
      console.log("INSERTED NODES");
    }

    // LOAD NODE EMBEDDINGS
    const node = new Cypher.Node({
      labels: ["Person"],
    });

    {
      for (const pEmbedding of peopleEmbeddings) {
        const { cypher, params } = new Cypher.Match(node)
          .where(
            Cypher.eq(node.property("id"), new Cypher.Param(pEmbedding.id))
          )
          .set([
            node.property("embedding"),
            new Cypher.List(
              pEmbedding.embedding.data[0].embedding.map(
                (v) => new Cypher.Literal(v)
              )
            ),
          ])
          .build();

        await session.run(cypher, params);
      }
      console.log("LOADED EMBEDDINGS");
    }

    await session.close();
    await driver.close();
  } catch (err) {
    console.error(err);
  }
})();
