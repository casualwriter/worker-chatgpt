# worker-chatgpt

[vanilla-chatgpt](https://github.com/casualwriter/vanilla-chatgpt) is so small, we can even host on cloudflare worker.

it is a [simple script](worker-chatgpt.js) to have the following

* a private ChatGPT client host on cloudflare worker.
* an openai API proxy on cloudflare worker

Here is the [sample site](https://chatgpt.hungchongki3984.workers.dev/).

## Setup

1. go to the dash board of cloudflare
2. create a service worker at [dashboard] -> [create a service]
3. at worker page, click [setting] -> [variable] -> [add variable]
4. add environment variable name `OPENAI_API_KEY` by the value of your OPENAI_API_KEY
5. click [encrypt] to encrypt the API KEY, and click [save and deploy]
6. click on [quick edit]
7. paste [worker-chatgpt.js](worker-chatgpt.js), click [save and deploy]

that's all. 

![](https://casualwriter.github.io/vanilla-chatgpt/worker-chatgpt.jpg)

a chatGPT client is available at {your-workder-name}.workers.dev

## As Proxy for local vanilla-chatgpt

The worker also works as a proxy of openai API, which can be called from local vanilla-chatgpt.

Simply revise onload() of [vanilla-chatgpt.html](https://github.com/casualwriter/worker-chatgpt/blob/main/vanilla-chatgpt.html)  
as below, then run it from local without OPENAI_API_KEY.

```
// set endPoint to "https://{your-workder-name}.workers.dev/v1/chat/completions"
window.onload = () => {
  chat.endPoint  = "https://{your-workder-name}.workers.dev/v1/chat/completions";
  chat.prompts = chat('list').innerHTML
  chat.showPrompts()
  chat('prompt').focus();
}
```


enjoy your private chatGPT everywhere.


(2023/04/18)

