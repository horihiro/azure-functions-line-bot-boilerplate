import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { Client } from "@line/bot-sdk";

const client: Client = new Client({
  channelSecret: '<Channel Secret>',
  channelAccessToken: '<Channel Access Token>'
});

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.');

  if (req.body.events.length === 2 && req.body.events[0].replyToken === '00000000000000000000000000000000' && req.body.events[1].replyToken === 'ffffffffffffffffffffffffffffffff') {
    context.res = {
      body: 'Hello LINE BOT!(POST)'
    };
    context.log('疎通確認用');
    return;
  }
  const session = context.bindings.sessionInput || { timestamp: Date.now() };

  // session timeout is 60 sec.
  if (!session.timestamp || Date.now() - new Date(session.timestamp).getTime() > 60000) delete session.message;

  await Promise.all(req.body.events.map(async (event) => {
    if (event.message.type !== 'text') return '';
    const text = session.message && session.message.text ? session.message.text : '(ｼｰﾝ...)';
    session.message = event.message;
    return await client.replyMessage(event.replyToken, {
      type: 'text',
      text
    });
  }));
  session.timestamp = Date.now();
  context.bindings.sessionOutput = session;

  context.res = {
    body: 'Hello LINE BOT!(POST)'
  };
};

export default httpTrigger;
