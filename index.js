import readline from 'readline-sync';
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {seiFunctionBot} from "./seibot.js";
import {readFileSync} from "fs";
import fs from "fs";
import {getQueryClient} from "@sei-js/core";
import {
    checkEligibilityInfo,
    checkGiftsInfo,
} from "./sendingGifts.js";
import {sendPostRequest, sendPostRequestToMint} from "./httpFunctions.js";
import {getFunds} from "./captcha.js";

const content = readFileSync("mnemonics.txt", 'utf-8');
const mnemonics = content.split(/\r?\n/);
const contentWithBoxes = readFileSync("mnemonicsGettingGift.txt", 'utf-8');
const mnemonicsWithBoxes = contentWithBoxes.split(/\r?\n/);
const restEndPoint = 'https://rest.atlantic-2.seinetwork.io/';

const queryClient  = await getQueryClient(restEndPoint);

const writeOutMnemonics = () => {
    mnemonics.forEach(element => console.log(element));
}

// Функция для получения адреса кошелька по мнемонике
const getAddressFromMnemonic = async (mnemonic) => {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'sei' });
    const [firstWallet] = await wallet.getAccounts();
    return firstWallet.address;
};

// Функция для вывода всех адресов кошельков в консоль
const writeOutAddresses = async () => {
    const addresses = await Promise.all(mnemonics.map(mnemonic => getAddressFromMnemonic(mnemonic)));
    console.log('All Addresses:');
    addresses.forEach(address => console.log(address));

    const fileId = fs.openSync("allAddresses.txt", "w");
    fs.truncateSync("allAddresses.txt");
    addresses.forEach((address) => {
            fs.writeSync(fileId, address + "\r\n", null, "utf8");
            console.log(address);
    });
    fs.closeSync(fileId);
};

const writeOutAddressesToSend = async () => {
    const addresses = await Promise.all(mnemonics.map(mnemonic => getAddressFromMnemonic(mnemonic)));
    console.log('All Addresses to send:');
    const fileId = fs.openSync("addressesToSend.txt", "w");
    fs.truncateSync("addressesToSend.txt");
    addresses.forEach((address,index) => {
        if (index % 2 !== 0) {
            fs.writeSync(fileId, address + "\r\n", null, "utf8");
            console.log(address);
        }
    });
    fs.closeSync(fileId);
};

const claimFromFaucet = async () => {

    const addresses = await Promise.all(mnemonics.map(mnemonic => getAddressFromMnemonic(mnemonic)));

    for(let i=0;i<addresses.length-1;i+=2) {

        const wallet1Balances = await queryClient.cosmos.bank.v1beta1
            .allBalances({address: addresses[i]});
        const wallet2Balances = await queryClient.cosmos.bank.v1beta1
            .allBalances({address: addresses[i+1]});

        const wallet1SeiBalance = wallet1Balances.balances.find(token => token.denom === 'usei')?.amount || '0';
        const wallet2SeiBalance = wallet2Balances.balances.find(token => token.denom === 'usei')?.amount || '0';

        if ((parseInt(wallet1SeiBalance)+parseInt(wallet2SeiBalance) < 100000)) {
            await getFunds(addresses[i]);
        }
    }
}

const checkBalances = async () => {
    const addresses = await Promise.all(mnemonics.map(mnemonic => getAddressFromMnemonic(mnemonic)));

    for (const address of addresses) {
        try {
            const walletBalance = await queryClient.cosmos.bank.v1beta1.allBalances({ address: address });

            const walletSeiBalance = walletBalance.balances.find(token => token.denom === 'usei');

            console.log(address, ' ', walletSeiBalance.amount);
        } catch (err) {
            console.log('Error in checking balance ');
        }
    }
};


const generateMnemonics = async () => {
    const numMnemonics = readline.questionInt('Enter the number of mnemonics to generate: ');

    const newMnemonics = [];
    for (let i = 0; i < numMnemonics; i++) {
        const mnemonic = await DirectSecp256k1HdWallet.generate(12, {prefix: 'sei'});
        console.log(mnemonic.secret.data);
        newMnemonics.push(mnemonic.mnemonic);
    }

    fs.appendFileSync('mnemonics.txt', '\n' + newMnemonics.join('\n'));
    console.log(`Added ${numMnemonics} new mnemonics to mnemonics.txt`);

    return newMnemonics;
}

const sendGiftsToNewAddresses = async () => {
    const info = await checkEligibilityInfo(mnemonics);

    const numMnemonics = info.reduce((summ, info) => {
        if (typeof info.giftsToSend === 'number') {
            console.log(info.giftsToSend)
            return summ+info.giftsToSend
        }

        return summ

    }, 0);
    const newMnemonics = [];
    for (let i = 0; i <= numMnemonics; i++) {
        const mnemonic = await DirectSecp256k1HdWallet.generate(12, {prefix: 'sei'});
        newMnemonics.push(mnemonic.mnemonic);
    }

    fs.appendFileSync('mnemonicsGettingGift.txt', '\n' + newMnemonics.join('\n'));
    console.log(`Added ${numMnemonics} new mnemonics to mnemonicsGettingGift.txt`);

    let counter = 0;
    const sendersFiltered = info.filter(info => info.giftsToSend > 0);


    for (let j=0; j<sendersFiltered.length; j++) {
        const senderAddress = sendersFiltered[j]?.senderAddress;


        if (senderAddress) {
            for (let y =0; y < sendersFiltered[j].giftsToSend; y++) {
                try {
                    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
                        newMnemonics[counter],
                        {prefix: 'sei'}
                    );

                    const [firstAccountWallet1] = await wallet.getAccounts();

                    const recipientAddress = firstAccountWallet1.address;

                    await sendPostRequest(senderAddress, recipientAddress);

                    await new Promise(resolve => setTimeout(resolve, 1500));

                    counter++;
                } catch (err) {
                    console.log(`Error occurred in for: ${err.message}`)
                }
            }
        }
    }
}

const mintGiftsInFile = async (mintMnemonic) => {
    for (let t=0; t<mintMnemonic.length; t++) {
        try {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
                mintMnemonic[t],
                {prefix: 'sei'}
            );

            const [firstAccountWallet1] = await wallet.getAccounts();

            const senderAddress = firstAccountWallet1.address;

            await sendPostRequestToMint(senderAddress);
        } catch (err) {
            console.log(`Error occurred in minting gifts: ${err.message}`);
        }
    }
}

const checkForGifts = async () => {
    const info = await checkEligibilityInfo(mnemonics);
    let counter = 0;

    info.map(wallet => {
        const {senderAddress, transactions, giftsToSend} = wallet;

        if (typeof giftsToSend === "number") {
            counter = counter + giftsToSend;
        }

        console.log(`Address: ${senderAddress} transactions: ${transactions}, gifts available: ${giftsToSend}`);
    });

    console.log(`Total gifts: ${counter}`);
}


while (true) {
    console.log('------------Helping functions----------------');
    console.log('1. Write all mnemonics');
    console.log('2. Write all addresses');
    console.log('3. Write into file addresses to send');
    console.log('4. Check Balances');
    console.log('5. Generate new mnemonics');
    console.log(' ');
    console.log('----------------Bot start--------------------');
    console.log('6. Faucet request');
    console.log('7. Start bot for Treasure Hunt');
    console.log('8. Start everyday bot (NOT WORKING NOW!!)');
    console.log(' ');
    console.log('--------------Gifts functions----------------');
    console.log('9. Check Eligibility for sending gifts');
    console.log('10. Send Gifts To New generated Wallets');
    console.log('11. Mint Gifts from mnemonicsGettingGift.txt');
    console.log('12. Check Gifts status');
    console.log(' ');
    console.log('---------------------------------------------');
    console.log('13. Exit');

    const choice = readline.question('Choose menu number: ');

    switch (parseInt(choice)) {
        case 1:
            writeOutMnemonics();
            break;

        case 2:
            await writeOutAddresses();
            break;

        case 3:
            await writeOutAddressesToSend();
            break;

        case 4:
            await checkBalances();
            break;

        case 5:
            await generateMnemonics();
            break;

        case 6:
            await claimFromFaucet();
            break;

        case 7:
            // Реализация запуска бота
            try {
                await seiFunctionBot(mnemonics);
            } catch (err) {
                console.log(err);
            }
            break;

        case 8:
           // await everydayBot(mnemonics);
            break;

        case 9:
            await checkForGifts();
            break;

        case 10:
            await sendGiftsToNewAddresses(mnemonics);
            break;

        case 11:
            await mintGiftsInFile(mnemonicsWithBoxes);
            break;

        case 12:
            await checkGiftsInfo(mnemonicsWithBoxes);
            break;

        case 13:
            console.log('Exiting...');
            process.exit(0)
            break;

        default:
            console.log('Invalid choice.');
            break;
    }

}


