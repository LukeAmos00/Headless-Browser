const fetch = require('node-fetch');
const fs = require('fs');

const sendCode = async codeToSend => {
    fetch('http://localhost:3000', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: codeToSend }) })
        .then(response => {
            if (response.ok) return response.text();
            else throw new Error("Request error");
        })
        .then(text => console.log(text))
        .catch(e => console.log(e.message));
};
const screenshot = async () => {
    fetch('http://localhost:3000', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screenshot: "true" }) })
        .then(response => {
            if (response.ok) return response.text();
            else throw new Error("Request error");
        })
        .then(text => console.log(text))
        .catch(e => console.log(e.message));
};
const channel = async channelToSend => {
    fetch('http://localhost:3000', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: channelToSend }) })
        .then(response => {
            if (response.ok) return response.text();
            else throw new Error("Request error");
        })
        .then(text => console.log(text))
        .catch(e => console.log(e.message));
};

sendCode("1455242");
channel("pokelawls");
setTimeout(screenshot, 5000);