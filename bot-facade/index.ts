import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import fetch, { Response } from 'node-fetch';
import { MessageEvent } from "@line/bot-sdk";

const TEST_USER_ID:string = "TEST_USER_ID";
const DEFAULT_EVENTS:Array<Object> = [
  {
    replyToken: '00000000000000000000000000000000',
    source: {
      userId: TEST_USER_ID 
    }
  },
  {
    replyToken: 'ffffffffffffffffffffffffffffffff',
    source: {
      userId: TEST_USER_ID 
    }
  }
];

const getFunctionDefaultKey = async function(context: Context, functionName: String): Promise<String> {
  const API_VERSION:String = '2017-09-01';
  const RESOURCE_URL:String = 'https://management.azure.com/';
  if (!process.env.MSI_ENDPOINT) return '';
  try {
    // get access token
    // see https://docs.microsoft.com/ja-jp/azure/app-service/overview-managed-identity#using-the-rest-protocol
    let response:Response = await fetch(`${process.env.MSI_ENDPOINT}?api-version=${API_VERSION}&resource=${RESOURCE_URL}`, {
      headers: {
        secret: process.env.MSI_SECRET
      }
    });
    let json:any = await response.json();

    // set parameters from environment variables
    const [, subscriptionId]:Array<String> = process.env.WEBSITE_OWNER_NAME.match(/^([^+]*)+.*$/);
    const resourceGroup:String = process.env.WEBSITE_RESOURCE_GROUP;
    const functionApp:String = process.env.WEBSITE_SITE_NAME;

    // get admin token for the function app using the access token
    // see https://docs.microsoft.com/ja-jp/rest/api/appservice/webapps/getfunctionsadmintoken
    response = await fetch(`https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Web/sites/${functionApp}/functions/admin/token?api-version=2016-08-01`, {
      headers: {
        Authorization: `Bearer ${json.access_token}`
      }
    });
    json = await response.json();

    // get master key using the admin token
    // see https://github.com/Azure/azure-functions-host/wiki/Key-management-API#host-key-resource-adminhostkeyskeyname
    // # but wrong url /admin/host/keys/ in the document.
    response = await fetch(`https://${process.env.WEBSITE_HOSTNAME}/admin/functions/${functionName}/keys/default`, {
      headers: {
        Authorization: `Bearer ${json}`
      }
    });
    json = await response.json();

    return json.value;
  } catch {
    return '';
  }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.');
  const events:Array<MessageEvent> = req.body && req.body.events ? req.body.events : DEFAULT_EVENTS;
  const userIds:Array<string> = Array.from(new Set(events.map(event => event.source.userId)));
  const botName:String = req.query.bot;
  if (!botName) {
    context.res = {
      body: ''
    };
    return;
  }
  const results:Array<string> = await Promise.all(userIds.map(async (userId) => {
    const key = await getFunctionDefaultKey(context, botName);
    const response:Response = await fetch(
      `http${process.env.WEBSITE_SITE_NAME?'s':''}://${process.env.WEBSITE_HOSTNAME}/api/${botName}?code=${key}`,
      {
        method: 'POST',
        body: JSON.stringify({
          source: { userId },
          events: events.filter(event => event.source.userId === userId)
        })
      }
    );
    try {
      const text:string = await response.text();
      return text;
    } catch (err) {
      return err.toString();
    }
  }));
  context.res = {
    body: results
  };
};

export default httpTrigger;
