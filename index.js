import readline from 'readline-sync';
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {seiFunctionBot} from "./seibot.js";
import {readFileSync} from "fs";
import fs from "fs";


const content = readFileSync("mnemonics.txt", 'utf-8');
const mnemonics = content.split(/\r?\n/);


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



while (true) {
    console.log('1. Write out all mnemonics');
    console.log('2. Write out all addresses');
    console.log('3. Write out to file addresses to send');
    console.log('4. Start bot');
    console.log('5. Exit');

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
            // Реализация запуска бота
            await seiFunctionBot(mnemonics);
            break;

        case 5:
            console.log('Exiting...');
            process.exit(0)
            break;

        default:
            console.log('Invalid choice.');
            break;
    }

}


