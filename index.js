
const commonSQLOnlyRequest = " Give me a sql select statement that answers the question. Only respond with sql syntax. If there is an error do not explain it!"
const strategies = {
    ZeroShot: setupSqlScript + commonSQLOnlyRequest
}

const questions = [

]


function main() {
    for (const strat in strategies) {
        let responses = {"strategy": strategy, "prompt_prefix": strategies[strat]}
        questionResults = []
        for (const question in questions) {
            console.log(question)
            let error = "none"
            try {
                let sqlSytaxResponse = getChatGPTResponse(strategies[strat] + " " + question)
                sqlSytaxResponse = sanitizeForJustSQL(sqlSytaxResponse)
                console.log(sqlSytaxResponse)
                let queryRawResponse = runSQL(sqlSytaxResponse)
                console.log(sqlSytaxResponse)
                let friendlyResponse = "I asked a question \"" + question + "\" and the response was \"" + queryRawResponse + "\ Please, just give a concise response in a more friendly way? Please do not give any other suggestions or chatter."
                friendlyResponse = getChatGPTResponse(friendlyResponse)
                console.log(friendlyResponse) 
            } catch (error) {
                error = error.message
                console.error(error.message)
            }

            questionResults.push({
                "question": question,
                "sql": sqlSytaxResponse,
                "queryRawResponse": queryRawResponse,
                "friendlyResponse": friendlyResponse,
                "error": error
            })
        }
        responses["questionResults"] = questionResults
    }
}


main()