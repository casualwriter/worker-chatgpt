# worker-chatgpt

[vanilla-chatgpt](https://github.com/casualwriter/vanilla-chatgpt) is so small, we can even host on cloudflare worker.

it is a [simple script](worker-chatgpt.js) to have the following

* a private ChatGPT client host on cloudflare worker.
* a openai API proxy on cloudflare worker

Here is the [sample site](https://chatgpt.hungchongki3984.workers.dev/).

## Setup

1. go to the dash board of cloudflare
2. create a service worker at [dashboard] -> [create a service]
3. at worker page, click [setting] -> [variable] -> [add variable]
4. add environment variable name `OPENAI_API_KEY` by the value of your OPENAI_API_KEY
5. click [encrrypt] to encrypt the API KEY, and click [save and deploy]
5. click on [quick edit], and paste the code

that's all. 

![](workder-chatgpt.jpg)

a chatGPT client is available at {your-workder-name}.workers.dev

more, the url is also available as proxy to call openai API, which can be called from local vanilla-chatgpt.

enjoy.



