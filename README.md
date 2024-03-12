# README

- [Docker] (https://docs.docker.com/)
- [Neo4j + LLMs] (https://graphacademy.neo4j.com/courses/llm-fundamentals/)
- [How to create embeddings] (https://platform.openai.com/docs/api-reference/embeddings/create)

```
MATCH (n)
WITH n, gds.similarity.cosine(<insert-embedding-here>, n.embedding) as similarity
RETURN n.name AS nodeName, n.age as age, similarity
ORDER BY similarity DESC
LIMIT 10;
```
