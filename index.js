import {DB}  from "./database/database.js";
import config from "./config.js";
import OpenAI from "openai";
import fs from "fs/promises";

const commonSQLOnlyRequest = " Give me a SQL SELECT statement that answers the question. Only respond with SQL syntax. If there is an error, do not explain it!";
const setupSqlScript = ""
const strategies = {
    ZeroShot: setupSqlScript + commonSQLOnlyRequest,
};

const questions = [
    // Add your questions here
];

async function getChatGPTResponse(query) {
    const configuration = new OpenAI.Configuration({
        apiKey: config.openApiKey,
    });

    const openai = new OpenAI.OpenAIApi(configuration);

    const responseStream = await openai.createChatCompletion(
        {
            model: "gpt-4",
            messages: [{ role: "user", content: query }],
            stream: true,
        },
        { responseType: "stream" }
    );

    const responseList = [];
    return new Promise((resolve, reject) => {
        responseStream.data
            .on("data", (chunk) => {
                const lines = chunk
                    .toString()
                    .split("\n")
                    .filter((line) => line.trim() !== "");
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.choices[0]?.delta?.content) {
                                responseList.push(data.choices[0].delta.content);
                            }
                        } catch (err) {
                            console.error("Error parsing JSON:", err.message);
                        }
                    }
                }
            })
            .on("end", () => {
                resolve(responseList.join(""));
            })
            .on("error", (error) => {
                reject(error);
            });
    });
}

function sanitizeForJustSQL(query) {
    const gptStartSQLMarker = "```sql";
    const gptEndSQLMarker = "```";

    if (query.includes(gptStartSQLMarker) && query.includes(gptEndSQLMarker)) {
        return query.split(gptStartSQLMarker)[1].split(gptEndSQLMarker)[0].trim();
    }
    return query.trim();
}

async function runSQL(query) {
    try {
        const connection = await DB.getConnection();
        const result = await DB.query(connection, query);
        await connection.end();
        return result;
    } catch (error) {
        console.error(`Error running SQL query: ${error.message}`);
        return null;
    }
}

async function saveResponsesToFile(responses, strategyName) {
    const fileName = `responses_${strategyName}.json`;
    try {
        await fs.writeFile(fileName, JSON.stringify(responses, null, 2));
        console.log(`Responses saved to ${fileName}`);
    } catch (error) {
        console.error("Error saving responses to file:", error.message);
    }
}

async function main() {
    try {
        const query = "What is the capital of France?";
        const response = await getChatGPTResponse(query);
        console.log("Response from ChatGPT:", response);
    } catch (error) {
        console.error("Error during test:", error.message);
    }
}

async function main2() {
    for (const strat in strategies) {
        const responses = { strategy: strat, prompt_prefix: strategies[strat] };
        const questionResults = [];

        for (const question of questions) {
            console.log("Processing question:", question);
            let error = "none";
            let sqlSyntaxResponse = "";
            let queryRawResponse = "";
            let friendlyResponse = "";

            try {
                // Generate SQL syntax
                sqlSyntaxResponse = await getChatGPTResponse(strategies[strat] + " " + question);
                sqlSyntaxResponse = sanitizeForJustSQL(sqlSyntaxResponse);
                console.log("SQL Syntax Response:", sqlSyntaxResponse);

                // Run SQL query
                queryRawResponse = await runSQL(sqlSyntaxResponse);
                console.log("Query Raw Response:", queryRawResponse);

                // Generate a friendly response
                const friendlyPrompt = `I asked a question "${question}" and the response was "${JSON.stringify(
                    queryRawResponse
                )}". Please, just give a concise response in a more friendly way? Please do not give any other suggestions or chatter.`;
                friendlyResponse = await getChatGPTResponse(friendlyPrompt);
                console.log("Friendly Response:", friendlyResponse);
            } catch (err) {
                error = err.message;
                console.error("Error processing question:", error);
            }

            questionResults.push({
                question,
                sql: sqlSyntaxResponse,
                queryRawResponse,
                friendlyResponse,
                error,
            });
        }

        responses["questionResults"] = questionResults;
        await saveResponsesToFile(responses, strat);
    }
}

main().catch((err) => console.error("Main function error:", err.message));
