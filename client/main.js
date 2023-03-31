// Copyright 2018 Google LLC.
// SPDX-License-Identifier: Apache-2.0
function init() {
  const input = document.querySelector('.input');
  const output = document.querySelector('.output');
  const close = document.querySelector('.close');
  const input2 = document.querySelector('.input2');
  const output2 = document.querySelector('.output2');
  const close2 = document.querySelector('.close2');
  const channel = Math.random();

  const supportsRequestStreams = (() => {
    let duplexAccessed = false;
    
    const hasContentType = new Request('', {
      body: new ReadableStream(),
      method: 'POST',
      get duplex() {
        duplexAccessed = true;
        return 'half';
      },
    }).headers.has('Content-Type');
    
    console.log({ duplexAccessed, hasContentType });
    
    return duplexAccessed && !hasContentType;
  })();

  if (!supportsRequestStreams) {
    output.textContent = `It doesn't look like your browser supports request streams.`;
    return;
  }

  const stream = new ReadableStream({
    start(controller) {
      input.addEventListener('input', (event) => {
        event.preventDefault();
        controller.enqueue(input.value);
        input.value = '';
      });
      
      close.addEventListener('click', () => controller.close());
    }
  }).pipeThrough(new TextEncoderStream());

  fetch(`https://localhost:8080/send?channel=${channel}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: stream,
    duplex: 'half',
  });

  fetch(`https://localhost:8080/receive?channel=${channel}`).then(async res => {
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      output.append(value);
    }
  });

  const stream2 = new ReadableStream({
    start(controller2) {
      input2.addEventListener('input', (event) => {
        event.preventDefault();
        controller2.enqueue(input2.value);
        input2.value = '';
      });
      
      close2.addEventListener('click', () => controller2.close());
    }
  }).pipeThrough(new TextEncoderStream());

  fetch(`https://localhost:8081/send?channel=${channel}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: stream2,
    duplex: 'half',
  });

  fetch(`https://localhost:8081/receive?channel=${channel}`).then(async res => {
    const reader2 = res.body.pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { done, value } = await reader2.read();
      if (done) return;
      output2.append(value);
    }
  });
}

init();