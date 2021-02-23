const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { Agent } = require('http');
const { exit } = require('process');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = 3000;

let browser, page;

let count = 0;

try {
    (async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto("https://twitch.tv/login/");

        let username, password; 
        fs.readFile('info.txt', 'utf-8', (error, data) => {
            if (error) {
                console.log('Could not read credentials from info.txt');
                return;
            }
            [username, password] = data.split('\r\n');
        });

        await page.click('button[role="tab"]');
        await page.type('#login-username', username);
        await page.type('#password-input', password);
        await page.click('button[data-a-target="passport-login-button"]');

        console.log('Send POST request with 2FA code');

        app.listen(PORT, () => {
            console.log(`Server is running on PORT: ${PORT}`);
        });
    })();
} catch(e) {
    throw new Error("Error entering login details");
}

app.get("/", (_request, response) => {
    response.send({
        url: page.url()
    });
});

app.post("/", (request, response) => {
    console.log(request.body);
    if (request.body.code) {
        (async () => {
            try {
                await page.type(
                    'input[data-a-target="tw-input"]',
                    request.body.code
                );
                await page.click('button[target="submit_button"]');
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await page.screenshot({path: 'after 2FA.png'});
                
                const url = await page.url();
                if (!url.includes('login')) {
                    response.send("Login Successful");
                } else {
                    response.send("Login Failed");
                }
            } catch(e) {
                response.send("Error Logging In");
            }
        })();
    }

    else if (request.body.screenshot) {
        try {
            (async () => {
                await page.screenshot({path: `requestedScreenshot${count}.png`});
            })();

            response.send(`Screenshot Taken requestedScreenshot${count++}.png`);
        } catch(e) {
            response.send("Error taking screenshot");
        }
    }

    else if (request.body.channnel) {
        try {
            (async () => {
                await page.goto(`https://twitch.tv/${request.body.channel}/`);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await page.screenshot({path: 'playing.png'})

                response.send(`Connected to ${await page.url()}`);
            })();
        } catch(e) {
            response.send("Error switching channel");
        }
    }
    else {
        response.send("No body provided");
    }
});
