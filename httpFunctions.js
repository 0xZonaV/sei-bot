export const sendPostRequest = async (senderAddress, recipientAddress) => {
    const url = 'https://atlantic-2.sunken-treasure.seinetwork.io/create-gift';
    const data = {
        senderAddress: senderAddress,
        recipientAddress: recipientAddress
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log(`Sending gift status: ${ result.status !== 'success' ? 'Fail Message: ' +result?.message : result?.status + ' from: ' + senderAddress + ' to ' + recipientAddress}`);
    } catch (error) {
        console.error(error);
    }
}

export const sendPostRequestToMint = async (senderAddress) => {

    const getGiftInfo = async () => {
        const url = `https://atlantic-2.sunken-treasure.seinetwork.io/gift?recipientAddress=${senderAddress}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            const result = await response.json();

            return result
        } catch (error) {
            console.error(error);
        }
    }

    try {
        const {data} = await getGiftInfo();

        const url = `https://atlantic-2.sunken-treasure.seinetwork.io/claim-gift`;
        const sendData = {
            senderAddress: data.senderAddress,
            recipientAddress: data.recipientAddress,
            code: "TWJ3ekdYSUZYbWlYLTVsSjBpQzFRRUpkSWt1dEdBRE5NenN2VTJsLXp6UVhqOjE2NzkxMzA1ODYxNTY6MTowOmFjOjE",
            state: "GUS6ac6Ss.IGmfpN1FVTobLWIw__USU8"
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendData)
            });

            const result = await response.json();

            if (result) {
                if (result.status === 'success') {
                    console.log('Success! Address: ', data.recipientAddress);
                }

                if (result.status === 'fail') {
                    console.log('FAIL! ', result.message);
                }

                if (result.status === 'error') {
                    console.log(result.message);
                }
            }
            console.log(result);
        } catch (error) {
            console.error(error);
        }
    } catch (err) {
        console.log(err);
    }
}

export const getGiftsInfo = async (senderAddress) => {
    const url = `https://atlantic-2.sunken-treasure.seinetwork.io/gift?recipientAddress=${senderAddress}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const result = await response.json();

        console.log(`Gift status: ${result.data?.giftStatus} address: ${result.data?.recipientAddress}`);

        if (result?.data?.giftStatus === 'minted') {
            return 1
        } else return 0

    } catch (error) {
        console.error(error);
    }
}

export const getEligibilityInfo = async (senderAddress) => {
    const url = `https://atlantic-2.sunken-treasure.seinetwork.io/eligibility?address=${senderAddress}`;
    let eligibilityInfo = {};

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const result = await response.json();




        if(result?.data){
            const giftsAvailable = parseInt(result.data.numGifts) - parseInt(result.data.giftsSent);

            eligibilityInfo = { senderAddress: senderAddress, giftsToSend: giftsAvailable, transactions: result.data.transactions };
        }

    } catch (error) {
        console.error(error);
    }

    return eligibilityInfo
}

export const revealNFT = async (address) => {
    const url = `https://atlantic-2.sunken-treasure.seinetwork.io/reveal`;
    const sendData = {
        address: address,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendData)
        });

        await response.json();
    } catch (error) {
        console.error(error);
    }


    const url2 = `https://atlantic-2.sunken-treasure.seinetwork.io/nfts?address=${address}`;

    try {
        const response = await fetch(url2, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const result = await response.json();
        if (result) {
            if (result.status === 'success') {
                if (result.data.tokens[0]?.attributes[1]?.value) {
                    console.log('Success! Address: ', address, 'Rarity:', result.data.tokens[0].attributes[1].value);
                    return result.data.tokens[0].attributes[1].value
                } else {
                    console.log('Cant find NFT');
                }
            }

            if (result.status === 'fail') {
                console.log('FAIL! ', result.message);
            }

            if (result.status === 'error') {
                console.log(result.message);
            }
        }
    } catch (error) {
        console.log(error)
    }
}
