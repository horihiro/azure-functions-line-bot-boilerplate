# azure-functions-line-bot-boilerplate

## What's this
This is a boilerplate for LINE bot on Azure Functions

  - It can handle information by user, such as session data,  using blob input/output bindings.
  - It makes it easy to add new bot as a function in single Function App.

## How to use this

  1. [Fork this on github](https://github.com/horihiro/azure-functions-line-bot-boilerplate/fork)
  1. Execute `git pull` forked repository in order to save to your local PC.
  1. Copy `example-delayed-echo` folder to same place as a new function.
  1. Create a new bot on [LINE Developers Console](https://developers.line.biz/console/)
  1. Update `channelSecret` and `channelAccessToken` in the function code to ones for the new bot copied at step 3.
```
    channelSecret: '<Channel Secret>',
    channelAccessToken: '<Channel Access Token>'
```
  6. Create new Function app and [set up a managed indentity](https://docs.microsoft.com/en-us/azure/app-service/overview-managed-identity#adding-a-system-assigned-identity) of the Function App
  1. Assign `Website Contributor` of the Function App to the MSI
  Deploy to Function App from Visual Studio Code.
  1. Set Webhook URL of the LINE bot on [LINE Developers Console](https://developers.line.biz/console/) to URL of `bot-facade` function with `&bot=<BOT_FUNCTION_NAME>` using function name created at step 4, as following.
```
    https://<FUNCTION_APP>.azurewebsites.net/api/bot-facade?code=XXXXXXXXX&bot=example-delayed-echo
```
  9. Replace `<CONTINER_FOR_BOT>` in `function.json` of the bot function to any container name (ex. `exampledelayedecho-sessioncontainer`, etc) for the bot.<br>
  Then you can save user data with `context.bindings.sessionOutput` and read it with `context.bindings.sessionInput` in the function code.
```json
    {
      "type": "blob",
      "name": "sessionInput",
      "path": "<CONTINER_FOR_BOT>/{source.userId}.json",
      "connection": "AzureWebJobsStorage",
      "direction": "in"
    },
    {
      "type": "blob",
      "name": "sessionOutput",
      "path": "<CONTINER_FOR_BOT>/{source.userId}.json",
      "connection": "AzureWebJobsStorage",
      "direction": "out"
    }
```
