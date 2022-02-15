// This script builds data for the Algolia index.
// It is run whenever the next js project is built. (It is called with the `postbuild` command in package.json.)
// Reference: https://www.contentful.com/blog/2021/07/02/add-algolia-instantsearch-to-nextjs-app/
import * as dotenv from "dotenv";
import algoliasearch from "algoliasearch";
import { getSortedWorkflowsData } from "./workflows";

(async function () {
  dotenv.config();

  try {
    const workflows = getSortedWorkflowsData();
    // Transform workflows to algolia object:
    // Set ObjectID and pick out relevant fields user wants to search on.
    // (User is unlikely to want to search on the arguments.)
    const transformed = workflows.map(
      ({ key, slug, title, description, tags, command }) => {
        return {
          objectID: slug,
          slug,
          title,
          description,
          tags,
          command,
        };
      }
    );

    // Initialize the client with environment variables
    const client = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
      process.env.ALGOLIA_SEARCH_ADMIN_KEY!
    );

    // Initialize the index with the algolia index name we set up
    const index = client.initIndex("workflow_specs");

    // Save the objects
    const algoliaResponse = await index.saveObjects(transformed);

    console.log(
      `🎉 Sucessfully added ${
        algoliaResponse.objectIDs.length
      } records to Algolia search. Object IDs:\n${algoliaResponse.objectIDs.join(
        "\n"
      )}`
    );
  } catch (error) {
    console.log(error);
  }
})();
