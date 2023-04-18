/*****************************************************************************
* 2023/04/18, worker-chatgpt, based on vanilla-chatgpt v0.70
*
* Copyright (c) 2023, Casualwriter (MIT Licensed)
* https://github.com/casualwriter/vanilla-chatgpt
* https://github.com/casualwriter/worker-chatgpt
*****************************************************************************/
const html=`
<!DOCTYPE html>
<head>
  <title>WorkerChat</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>

<style>
body  { font-family: Roboto,Lato,Arial; line-height:1.5; font-size:16px; margin:0; padding:0; overflow:hidden; }
header { background: linear-gradient(to bottom right, #06c, #fc0); }
header { color:#eee; padding:12px; font-size:20px; height:45px; font-family:"Open Sans" }
#left  { float:left;  width:calc(60vw - 30px); height:calc(100vh - 100px); }
#right { float:right; width:40%; height:calc(100vh - 100px); } 
#left, #prompt, #list { border:1px solid grey; padding:6px; overflow:auto }
#prompt { height:3em; padding:10px; overflow:auto; resize: vertical; }
#list li:hover  { background:#ddd }
#menu button    { font-family:Lato,arial; border-radius:3px; border:none; padding:3px 6px}
#right textarea { display:block; width:96%; margin:3px auto; background:#eee}
.prompt { color:#322; background:#ccc; padding:6px; }

.markdown code { background:#f0f0f0; color:navy; border-radius:6px; padding:2px; } 
.markdown pre  { background:#f0f0f0; margin:16px; border:1px solid #ddd; padding:8px; border-radius: 6px;  } 
.markdown pre:hover button { display:block; }
.markdown pre button { display:none; float:right; margin:4px }
.markdown blockquote { background:#f0f0f0; border-left:6px solid grey; padding:8px }
.markdown table { margin:12px; border-collapse: collapse; }
.markdown th    { border:1px solid grey; background:lightgrey; padding:6px; } 
.markdown td    { border:1px solid grey;  padding:6px; }
.markdown tr:nth-child(even) {  background:#f0f0f0;  }

@media print{
  #menu, #right { display:none!important }
  #left { position:relative; width:100%; left:0px; top:0px; border:none; height:auto; overflow:hidden }
  .prompt { border-bottom: 1px solid grey }
}

@media screen and (max-width: 880px) {
  #list, .desktop { display:none!important }
  #right   { position:absolute; width:auto; height:auto; bottom:10px; left:8px; right:70px }
  #prompt  { height:1.2em; padding:10px; overflow:auto }
  #btnSend { position:absolute; height:36px; bottom:12px; right:12px; }
  #left	   { width:97%; height:calc(100vh - 154px);  }
}
</style>

<header>
  <div id=heading style="float:left">Vanilla ChatGPT<br>
    <span id=message style="color:yellow;font-size:10px">
        <a href="https://github.com/casualwriter/vanilla-chatgpt" target=_NEW>GitHub</a> (Worker Version@20230418)
    </span>
  </div>
  <div id=menu style="float:right;">
    <button onclick="chat.recognition()" title="voice input">🎤</button>
    <button onclick="chat.export()" title="export conversation">Export</button>
    <button class=desktop onclick="chat.showPrompts()" title="show prompts">Prompts</button>&nbsp;
    <button id=btnSend accesskey=s onclick="chat.submit()" title="[Alt-S] submit prompt"><b>S</b>end</button>
  </div>
</header>

<div id="content" style="margin:8px;color:#112;background:bed">
  <div id="right">
     <textarea id=prompt placeholder="please input prompt here.."></textarea>
     <div id="list" style="height:calc(100vh - 163px)">
        <b>Samples of prompt</b>
        <ul>
          <li>A quote of today
          <li>Introduce "vanilla chatGPT"
          <li>Summarize the following content ...
        </ul>
     </div>
  </div>
  <div id="left">
    <div id="main" style="padding:12px; max-width:960px">
       <h3>Welcome to vanilla-chatgpt.</h3>
       <p class=desktop>Please submit prompt by pressing 
       <label><input type="radio" name="submitkey" onclick="chat.hotkey='enter'" checked>[Enter]</label>
       <label><input type="radio" name="submitkey" onclick="chat.hotkey='ctrl'">[Ctrl-Enter]</label>
       </p>
       [Ctrl-P] to print <br>[Export] to export conversation 
    </div>
  </div>
</div>

<link rel="stylesheet" href="https://casualwriter.github.io/dist/casual-markdown@0.92.css">
<script src="https://casualwriter.github.io/dist/casual-markdown@0.92.js"></script>

<script>
const chat = (id) => window.document.getElementById(id);

// Set the API endpoint URL
chat.endPoint  = "https://api.openai.com/v1/chat/completions";
chat.model = "gpt-3.5-turbo"
chat.body  = { model: chat.model, temperature: 0.8 }
chat.history = []

// stream result from openai
chat.stream = function (prompt) {

  chat.body.stream = true 
  chat.body.messages = [ { role: "user", content: prompt} ]
  chat.headers = { "Content-Type": "application/json" }
  chat.result = ''
  chat.controller = new AbortController();
  const signal = chat.controller.signal
   
  for (let i=chat.history.length-1; i>=0&&i>(chat.history.length-3); i--) {
    chat.body.messages.unshift( { role:'assistant', content: chat.history[i].result } );
    chat.body.messages.unshift( { role:'user', content: chat.history[i].prompt } );
  }
  
  fetch( chat.endPoint, { method:'POST', headers: chat.headers, body: JSON.stringify(chat.body), signal } )
  .then( response => { 
  
    if (!response.ok) {
        if (response.status == 401) throw new Error('401 Unauthorized, invalide API Key');
        throw new Error('failed to get data, error status '+response.status)
    }
    
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    
    reader.read().then( function processText({ done, value }) {
    
      if (done) return chat.oncomplete(chat.result);
      
      const lines = (chat.value=value).split('\\n');

      for (let i in lines) {
        if (lines[i].length === 0) continue;     // ignore empty message
        if (lines[i].startsWith(':')) continue;  // ignore comment message
        if (lines[i] === 'data: [DONE]') return chat.oncomplete(chat.result); // end of message
        
        chat.json = JSON.parse(lines[i].substring(6));
        if (chat.json.choices) {
          chat.result += (chat.json.choices[0].delta.content||'') 
        }	 
      }

      chat.onmessage(chat.result)
      return reader.read().then(processText);
       
    } )
    
  } ).catch( error => chat.onerror(error) );
  
}

// default error handle
chat.onerror = (error) => { alert(error);  };

// export conversation
chat.export = (fname) => {
  const link = document.createElement('a');
  link.href = 'data:text/plain;charset=utf-8,' 
  chat.history.forEach( (x) => { 
    link.href += encodeURIComponent('### '+x.prompt+'\\n\\n'+x.result+'\\n\\n') 
  } );  
  link.download = fname||('chat-'+new Date().toISOString().substr(0,16))+'.md';
  link.click();
} 

//================= main program ===================
// display result when receiving message
chat.onmessage = function (text) {
  chat("message").innerHTML = 'receiving messages..'
  chat("receiving").innerHTML = md.html(text + '<br><br>');
}

// show whole conversation when message completed
chat.oncomplete = (text) => {
  let html1='', html2=''
  chat("message").innerHTML = '(model: '+ chat.model + ')'
  chat.history.push( { prompt: chat.prompt, result: chat.result } )
  
  for (let i=0; i<chat.history.length; i++) {
     html1 += '<h4 class=prompt id=prompt'+i+' ondblclick="chat.clipboard('+i+')" title="doubleclick to copy">' 
     html1 += chat.history[i].prompt + '</h4>\\n' + chat.history[i].result + '\\n\\n'
     html2 += '<li onclick="location=this.title" title="#prompt' + i + '">' + chat.history[i].prompt
  }
  
  html1 += '<div><button style="float:left" onclick="chat.redo()">Redo</button>'
  html1 += '<button style="float:right" onclick="chat.speak()">🔊 speak</button>'
  
  chat("main").innerHTML = md.html(html1) + '<br></div>'
  chat("list").innerHTML = html2
  chat("left").scrollTop = chat("left").scrollHeight;
  chat("btnSend").innerHTML = '<b>S</b>end'
  
  if (document.body.clientWidth > 800) {
    chat('prompt').select()
    chat('prompt').focus();
  } else {
    chat('prompt').value = ''
  }  
}

// abort fetch request.
chat.abort = () => { 
  chat.controller.abort()
  chat("receiving").innerHTML += '\\n<font color=red>Message Aborted!</font>'
  chat("receiving").id = 'abort';
};

// submit prompt
chat.submit = () => {
  if (chat("btnSend").innerText === 'Stop..') {
    chat.abort()
    chat("btnSend").innerText = 'Send'
  } else {
    chat.stream( chat.prompt = chat('prompt').value )
    chat("main").innerHTML += '<h4 class=prompt>' + chat.prompt + '</h4>\\n<div id=receiving>Receiving....</div>'
    chat("left").scrollTop = chat("left").scrollHeight;
    chat("btnSend").innerText = 'Stop..'
  }  
}

// show default prompt list
chat.showPrompts = () => {
  chat('list').innerHTML = chat.prompts
  document.querySelectorAll('#list li').forEach( (element) => {
    element.addEventListener('click', (event) => {
      chat('prompt').value = element.innerText
      chat('prompt').focus();
    });
  })
};

chat.clipboard = (i) => {
  navigator.clipboard.writeText( '### '+ chat.history[i].prompt + '\\n\\n' + chat.history[i].result )
  chat("message").innerText = 'dialogue has been copied to clipboard'
}

// set endPoint to "/v1/chat/completions"
window.onload = () => {
  chat.endPoint  = "/v1/chat/completions";
  chat.prompts = chat('list').innerHTML
  chat.showPrompts()
  chat('prompt').focus();
}

// add submit hot-key of ctrl-enter
document.addEventListener('keydown', function(event) {
  if ( event.key==='Enter' && (chat.hotkey!='ctrl'||event.ctrlKey)) {
    if (chat("btnSend").innerText === 'Send') { 
      event.preventDefault(); chat.submit(); 
    }
  }  
});

// [20230412] redo. submit latest prompt
chat.redo = () => {
  chat.history.pop()
  chat('prompt').value = chat.prompt
  chat.submit()
}

// speak the latest answer
chat.speak = (i)  => {
  if (window.speechSynthesis.speaking) {
     window.speechSynthesis.cancel();
  } else {
    i = ( i>=0? i : chat.history.length-1 )
    const utterance = new SpeechSynthesisUtterance(chat.history[i].result);
    utterance.rate = 1.5;
    window.speechSynthesis.speak(utterance);
  }
}

// voice recognition
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
chat.speech = new SpeechRecognition();

chat.speech.onresult = e => chat('prompt').value = e.results[0][0].transcript;

chat.recognition = () => {
  chat.speech.start()
  chat('prompt').value = 'Listening...'
}   
</script>
`;

async function handleRequest(request, env) {
  if (request.method === 'GET') {
    return new Response( html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } } );
  } else {
    return proxy(request, env);
  }
  throw 'Access forbidden';
}


async function proxy(request, env) {
  const url = new URL(request.url);
  url.host = 'api.openai.com';

  const modifiedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: request.method,
    body: request.body,
    redirect: 'follow'
  });

  modifiedRequest.headers.set('Authorization', `Bearer ${env.OPENAI_API_KEY}` );
  
  const response = await fetch(modifiedRequest);
  const modifiedResponse = new Response(response.body, response);

  // allow cross-region request
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');

  return modifiedResponse;
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env).catch(err => new Response(err || 'Unknown reason', { status: 403 }))
  }
};
