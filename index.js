import readline from 'readline-sync';
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {seiFunctionBot} from "./seibot.js";
import {readFileSync} from "fs";
import fs from "fs";
import {getQueryClient} from "@sei-js/core";


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
            console.log('Error');
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


while (true) {
    console.log('1. Write out all mnemonics');
    console.log('2. Write out all addresses');
    console.log('3. Write out to file addresses to send');
    console.log('4. Write out Balances');
    console.log('5. Generate new mnemonics');
    console.log('6. Start bot');
    console.log('7. Exit');

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
            console.log('Exiting...');
            process.exit(0)
            break;

        default:
            console.log('Invalid choice.');
            break;
    }

}


