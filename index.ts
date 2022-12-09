import axios from "axios";
import * as dotenv from 'dotenv'
import * as env from 'env-var';
const { App } = require('@slack/bolt');

dotenv.config()

const app = new App({
    signingSecret: env.get('SLACK_SIGNING_SECRET').required().asString(),
    // OAuth Token - Install APP
    token: env.get('SLACK_BOT_TOKEN').required().asString(),
    // Socket mode token
    appToken: env.get('SLACK_APP_TOKEN').required().asString(),
    port: 3000,
    socketMode: true,
});

const shortenerApiBearerToken = env.get('SHORTY_API_AUTH_BEARER_TOKEN').required().asString()
// noinspection TypeScriptValidateTypes
const shortenerClient = axios.create({
    baseURL: 'https://vavo.to/miniurl',
    timeout: 1000,
    headers: {Authorization: `Bearer ${shortenerApiBearerToken}`}
})


interface ShortenUrlParams {
    url: string
    id?: string
}

async function shortenUrl(params: ShortenUrlParams) {
    const shortenRes = await shortenerClient.post('/url', params)
    return shortenRes.data
}

app.command('/shorten', async ({ command, ack, say }) => {
    await ack()
    const args = command.text.split(' ')
    let url, id

    if (args.length > 2) {
        await say('could not understand request, only require a maximum of 2 inputs, try again')
        return
    }
    [url, id] = args
    console.log(`Shortening url: ${url}, id: ${id}`)
    console.log(command)
    const shortenedUrl = await shortenUrl({url, id})
    await say({
        text: `Shortened url: ${shortenedUrl}`,
        replace_original: false,
        response_type: 'ephemeral',
        unfurl_links: false,
        unfurl_media: false,
    });
});

(async () => {
    await app.start();
    console.log('Shorty is running!');
})();