const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = 3000;

let browser, page;

let count = 0;

let username = "";

const login = async () => {
    let cookies;
    try {
        cookies = fs.readFileSync('cookies.json', 'utf-8');
        await page.setCookie(...JSON.parse(cookies));

        await page.goto('https://twitch.tv/login/');
        if (!await page.url().includes('login')) {
            (async () => {
                fs.writeFile(
                    'cookies.json',
                    JSON.stringify(await page.cookies(), null, 2),
                    err => { if (err) console.log("Write Error" , err) }
                );
            })();
            console.log('Logged in using cookies');
            
            await page.goto('https://twitch.tv/)');
            page.evaluate(() => {
                const cookieAccept = document.querySelector(
                    'button[data-a-target="consent-banner-accept"]'
                );

                if (cookieAccept) cookieAccept.click();
            })

            return;
        }
    } catch(e) {
        console.log('Error reading cookies');
        console.log(e.message);
    }

    await page.goto('https://twitch.tv/login/');

    let password; 
    fs.readFile('info.txt', 'utf-8', (error, data) => {
        if (error) throw new Error('Could not read credentials from info.txt');
        [username, password] = data.split('\r\n');
    });

    await page.click('button[role="tab"]');
    await page.type('#login-username', username);
    await page.type('#password-input', password);
    await page.click('button[data-a-target="passport-login-button"]');

    console.log('Send POST request with 2FA code');
}

try {
    (async () => {
        browser = await puppeteer.launch(
            {executablePath: '/usr/bin/chromium-browser'}
        );
        page = await browser.newPage();

        login();

        app.listen(PORT, () => {
            console.log(`Server is running on PORT: ${PORT}`);
        });
    })();
} catch(e) {
    console.log(e.message);
    throw new Error("Error entering login details");
}

app.get("/", (_request, response) => {
    const cookies = fs.readFileSync('cookies.json', 'utf-8');
    const cookiesSet = cookies.includes(username);

    const resp = {
        url: page.url(),
        'Logged In': cookiesSet
    }

    console.log("GET request", resp);
    response.send(resp);
});

app.post("/", (request, response) => {
    console.log(request.body);

    if (request.body.login) {
        try {
            (async () => {
                login();
        
                app.listen(PORT, () => {
                    console.log(`Server is running on PORT: ${PORT}`);
                });
            })();
        } catch(e) {
            console.log(e.message);
            throw new Error("Error entering login details");
        }
    }

    else if (request.body.code) {
        try {
            (async () => {
                if (!(await page.url().includes('login'))) {
                    response.send("Not on login page");
                }

                await page.type(
                    'input[data-a-target="tw-input"]',
                    request.body.code
                );
                await page.click('button[target="submit_button"]');
                setTimeout(async () => {
                    await page.screenshot({path: 'after 2FA.png'});
                }, 10 * 1000);
                
                if (!await page.url().includes('login')) {
                    fs.writeFile(
                        'cookies.json',
                        JSON.stringify(await page.cookies(), null, 2),
                        err => { if (err) console.log("Write Error" , err) }
                    );

                    response.send("Login Successful");
                } else {
                    response.send("Login Failed");
                }
            })();
        } catch(e) {
            response.send("Error Logging In");
            console.log(e.message);
        }
    }

    else if (request.body.saveCookies) {
        try {
            (async () => {
                fs.writeFile(
                    'cookies.json',
                    JSON.stringify(await page.cookies(), null, 2),
                    err => { if (err) console.log("Write Error" , err) }
                );

                response.send("Saved cookies");
            })();
        } catch(e) {
            response.send("Error saving cookies");
            console.log(e.message);
        }
    }

    else if (request.body.screenshot) {
        try {
            (async () => {
                await page.screenshot(
                    {path: `requestedScreenshot${count}.png`}
                );
            })();

            response.send(
                `Screenshot Taken requestedScreenshot${count++}.png`
            );
        } catch(e) {
            response.send("Error taking screenshot");
            console.log(e.message);
        }
    }

    else if (request.body.channel) {
        try {
            (async () => {
                await page.goto(`https://twitch.tv/${request.body.channel}/`);
                setTimeout(async () => {
                    await page.screenshot({path: 'playing.png'});
                }, 10 * 1000);
                setTimeout(async() => await page.evaluate(() => {
                    let button = document.querySelector(
                        'button[data-a-target="player-overlay-mature-accept"]'
                    );
                    if (button) {
                        button.click();
                    }
                }));
                response.send(`Connected to ${await page.url()}`);
            })();
        } catch(e) {
            response.send("Error switching channel");
            console.log(e.message);
        }
    }
    else {
        response.send("Invalid body provided");
    }
});
