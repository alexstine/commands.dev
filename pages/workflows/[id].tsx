import Head from "next/head";
import { GetStaticProps, GetStaticPaths } from "next";
import { useState } from "react";

import { getAllWorkflowIds, getWorkflowData } from "../../lib/workflows";
import Layout from "../../components/layout";
import WorkflowTags from "../../components/WorkflowTags";

interface ArgumentValues {
  [name: string]: string;
}

interface Argument {
  name: string;
  placeholder: string;
  id: string;
}

enum TokenType {
  ArgumentToken,
  TextToken,
}
interface ArgumentToken {
  type: TokenType.ArgumentToken;
  id: string;
}

interface TextToken {
  type: TokenType.TextToken;
  text: string;
}

type Token = ArgumentToken | TextToken;

export default function Workflow({
  workflowData,
}: {
  workflowData: {
    title: string;
    description: string;
    tags: string[];
    arguments: Argument[];
    command: string;
  };
}) {
  // Initializes a key-value map of <Argument Id>: Empty String
  const initialValues: ArgumentValues = workflowData.arguments.reduce(
    (a, v) => ({ ...a, [v.id]: "" }),
    {}
  );
  const [values, setValues] = useState(initialValues);
  const [focusedArg, setFocusedArg] = useState(
    workflowData.arguments.length > 0 ? workflowData.arguments[0].id : null
  );

  // Updates the value in the map corresponding to the Argument Id key
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const getArgText = (id: string) => {
    // If there's something typed in the input box - return that
    if (values[id] && values[id] != "") {
      return values[id];
    }

    // If there's not something typed - retrieve the placeholder
    for (let argument of workflowData.arguments) {
      if (argument.id === id) {
        return argument.placeholder;
      }
    }
  };

  const getArgHighlightStyle = (id: string) =>
    (focusedArg === id
      ? "text-white dark:text-white font-medium"
      : "bg-opacity-30 text-black dark:text-white") +
    " bg-arg-highlight px-1 font-mono";

  // `getTokenizedCommand` creates an array of CommandTokens which represent a string of text
  // and its associated argument argId if that token represents an argument.
  // TODO: add a test for this function
  const getTokenizedCommand = (command: string) => {
    if (command.length === 0) {
      return [];
    }
    let commandTokens: Token[] = [];
    for (let argument of workflowData.arguments) {
      // This regex ensures that the split happens only on the first occurence of the word
      let regex = new RegExp(`\\$${argument.id}(.*)`, "s");
      const [beforeArg, afterArg] = command.split(regex);
      // If this arg is not a match - continue to the next arg
      if (beforeArg === command) {
        continue;
      }

      // If there was a match, recurse on the substrings, add the ArgToken, and return what's built
      commandTokens = commandTokens.concat(getTokenizedCommand(beforeArg));
      commandTokens.push({
        type: TokenType.ArgumentToken,
        id: argument.id,
      });
      commandTokens = commandTokens.concat(getTokenizedCommand(afterArg));

      return commandTokens;
    }

    // If there were no matches, just add the current command as a TextToken and return
    commandTokens.push({ type: TokenType.TextToken, text: command });
    return commandTokens;
  };

  return (
    <Layout>
      <Head>
        <title>{workflowData.title}</title>
      </Head>
      <div className="flex pt-10">
        <div className="w-1/6 hidden md:flex" />
        <div className="flex-col md:flex-col flex-grow pl-6 pr-6">
          <h1 className="text-2xl text-black dark:text-white font-bold pb-2">
            {workflowData.title}
          </h1>
          <p className="text-black dark:text-white pb-10">
            {workflowData.description}
          </p>
          {workflowData.arguments.map((argument) => (
            <div key={argument.id} className="flex-col pb-9">
              <span
                className={getArgHighlightStyle(argument.id) + " py-1 text-sm"}
              >
                {argument.name}
              </span>
              <div />
              <input
                className="border-solid border mt-2 pl-2 py-1 
                font-mono text-sm rounded-md border-card-border-light 
                bg-command-light dark:bg-command-dark dark:text-white placeholder:opacity-40"
                value={values[argument.id] ?? ""}
                onChange={handleInputChange}
                type="text"
                placeholder={argument.placeholder}
                name={argument.id}
                onFocus={() => setFocusedArg(argument.id)}
              />
              <div className="text-sm opacity-50 pt-1 pl-1 dark:text-white">
                {"enter a value for " + argument.name}
              </div>
            </div>
          ))}
          <br />
          <div className="text-sm text-black dark:text-white pb-2">Command</div>
          <div className="bg-command-light dark:bg-command-dark max-w-[32rem] whitespace-pre p-4 text-sm mb-5">
            <code>
              {/* If the token is a text token (has "text" in the object) then render it normally, else
          retrieve its value from the input or placeholder and render it with highlight */}
              {getTokenizedCommand(workflowData.command).map((token, idx) => {
                switch (token.type) {
                  case TokenType.ArgumentToken:
                    return (
                      <span
                        key={idx}
                        className={getArgHighlightStyle(token.id)}
                      >
                        {getArgText(token.id)}
                      </span>
                    );
                  case TokenType.TextToken:
                    return (
                      <span key={idx} className="text-black dark:text-white">
                        {token.text}
                      </span>
                    );
                }
              })}
            </code>
          </div>
          {WorkflowTags(workflowData.tags)}
          <div className="h-px w-3/4 bg-card-border-light dark:bg-card-border-dark mt-12" />
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllWorkflowIds();
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const workflowData = await getWorkflowData(params?.id as string);
  return {
    props: {
      workflowData,
    },
  };
};
