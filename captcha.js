const capthaAPIKey = "YOUR_KEY_HERE";

async function getCaptchaId() {
    const apiEndpoint = "https://2captcha.com/in.php";
    const params = new URLSearchParams({
        key: capthaAPIKey,
        method: "hcaptcha",
        sitekey: "73ec4927-b43f-40b1-b61a-646a5ec58a45",
        pageurl: "https://app.seinetwork.io/faucet/",
    });
    const response = await fetch(`${apiEndpoint}?${params}`);
    const responseBody = await response.text();
    if (responseBody.startsWith("OK|")) {
        return responseBody.substr(3); // Return captcha ID without the "OK|" prefix
    } else {
        throw new Error(`Failed to get captcha ID: ${responseBody}`);
    }
}

async function sendSeiRequest(captchaKey, address) {
    const url = "https://faucet-v2.seinetwork.io/atlantic-2";
    const data = {
        address: address,
        captchaKey: captchaKey
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        console.log(`Address: ${address} status: ${result.status}`);
    } catch (err) {
        console.log(`Error occurred in captcha function: ${err}`)
    }

}

async function getCaptchaResult(captchaId) {
    const url = `https://2captcha.com/res.php?key=${capthaAPIKey}&action=get&id=${captchaId}`;
    try{
        let response = await fetch(url);
        let result = await response.text();
        while (result.includes('CAPCHA_NOT_READY')) {
            // Повторяем запрос через 5 секунд
            await new Promise(resolve => setTimeout(resolve, 5000));
            response = await fetch(url);
            result = await response.text();
        }
        return result;
    } catch (err) {
        console.log(`Error occurred in captcha function: ${err}`)
    }

}

export const getFunds = async (address) => {
    try {
        const captchaId = await getCaptchaId();
        const captchaResult = await getCaptchaResult(captchaId);

        await sendSeiRequest(captchaResult.substr(3), address);
    } catch (err) {
        console.log(err)
    }
}