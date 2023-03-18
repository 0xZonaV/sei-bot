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


const content = readFileSync("mnemonics.txt", 'utf-8');
const mnemonics = content.split(/\r?\n/);
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
    console.log('All Addresses:');
    const fileId = fs.openSync("addressesToSend.txt", "w");
    fs.truncateSync("addressesToSend.txt");
    addresses.forEach((address,index) => {
        if (index % 2 === 0) {
            fs.writeSync(fileId, address + "\r\n", null, "utf8");
            console.log(address);
        }
    });
    fs.closeSync(fileId);
};

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

    console.log(info)

    const numMnemonics = info.reduce((summ, info) => summ+info.giftsToSend, 0);
    const newMnemonics = [];
    for (let i = 0; i <= numMnemonics; i++) {
        const mnemonic = await DirectSecp256k1HdWallet.generate(12, {prefix: 'sei'});
        newMnemonics.push(mnemonic.mnemonic);
    }

    fs.appendFileSync('mnemonicsGettingGift.txt',  newMnemonics.join('\n'));
    console.log(`Added ${numMnemonics} new mnemonics to mnemonicsGettingGift.txt`);

    let counter = 0;
    const sendersFiltered = info.filter(info => info.giftsToSend > 0);

    for (let j=0; j<=sendersFiltered.length; j++) {
        try {
            const senderAddress = sendersFiltered[j].senderAddress;

            for (let y=counter+1; y<=sendersFiltered[j].giftsToSend; y++) {
               try {
                   const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
                       newMnemonics[y],
                       {prefix: 'sei'}
                   );

                   const [firstAccountWallet1] = await wallet.getAccounts();

                   const recipientAddress = firstAccountWallet1.address;

                   await sendPostRequest(senderAddress,recipientAddress);

                   counter++;
               } catch (err) {
                   console.log(`Error occurred in for: ${err.message}`)
               }
            }

        } catch (err) {
            console.log(`Error occurred in sending gifts: ${err.message}`);
        }

    }

    for (let t=0; t<newMnemonics.length; t++) {
        try {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
                newMnemonics[t],
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

        counter=counter+giftsToSend;

        console.log(`Address: ${senderAddress} transactions: ${transactions}, gifts available: ${giftsToSend}`);
    });

    console.log(`Total gifts: ${counter}`);
}


while (true) {
    console.log('1. Write out all mnemonics');
    console.log('2. Write out all addresses');
    console.log('3. Write out to file addresses to send');
    console.log('4. Check Balances');
    console.log('5. Generate new mnemonics');
    console.log('----------------------------------');
    console.log('6. Start bot for Treasure Hunt');
    console.log('7. Start everyday bot (NOT WORKING NOW!!)');
    console.log('----------------------------------');
    console.log('8. Check Eligibility for sending gifts');
    console.log('9. Send Gifts To New generated Wallets');
    console.log('10. Check Gifts status');
    console.log('11. Exit');

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
            // Реализация запуска бота
            await seiFunctionBot(mnemonics);
            break;

        case 7:
           // await everydayBot(mnemonics);
            break;

        case 8:
            await checkForGifts();
            break;

        case 9:
            await sendGiftsToNewAddresses(mnemonics);
            break;

        case 10:
            await checkGiftsInfo(mnemonics);
            break;

        case 11:
            console.log('Exiting...');
            process.exit(0)
            break;

        default:
            console.log('Invalid choice.');
            break;
    }

}


