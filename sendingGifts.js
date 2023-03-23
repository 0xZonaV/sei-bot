import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {getEligibilityInfo, getGiftsInfo, sendPostRequest, sendPostRequestToMint} from "./httpFunctions.js";


export const sendingGifts = async (newMnemonics) => {

    for (let i = 0; i < newMnemonics.length; i++) {
        try {
            const wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(
                newMnemonics[i],
                {prefix: 'sei'}
            );

            const wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(
                newMnemonics[i + 1],
                {prefix: 'sei'}
            );

            const [firstAccountWallet1] = await wallet1.getAccounts();
            const [firstAccountWallet2] = await wallet2.getAccounts();

            await sendPostRequest(firstAccountWallet1.address, firstAccountWallet2.address);
        } catch (err) {
            console.log(err);
        }
    }

}

export const claimingGifts = async (newMnemonics) => {

    for (let i = 0; i < newMnemonics.length; i++) {
        try {
            const wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(
                newMnemonics[i],
                {prefix: 'sei'}
            );

            const [firstAccountWallet1] = await wallet1.getAccounts();

            await sendPostRequestToMint(firstAccountWallet1.address);
        } catch (err) {
            console.log(err);
        }
    }
}

export const checkGiftsInfo = async (newMnemonics) => {
    let counter = 0;

    for (let i = 0; i < newMnemonics.length; i++) {
        try {
            const wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(
                newMnemonics[i],
                {prefix: 'sei'}
            );

            const [firstAccountWallet1] = await wallet1.getAccounts();

            const mintedCount = await getGiftsInfo(firstAccountWallet1.address);

            counter+=mintedCount;

        } catch (err) {
            console.log(err);
        }
    }

    console.log(`Total minted gifts: ${counter}`);

}

export const checkEligibilityInfo = async (newMnemonics) => {

    const eligibilityInfo = [];


    for (let i = 0; i < newMnemonics.length; i++) {
        try {
            const wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(
                newMnemonics[i],
                {prefix: 'sei'}
            );

            const [firstAccountWallet1] = await wallet1.getAccounts();

           const info = await getEligibilityInfo(firstAccountWallet1.address);

            eligibilityInfo.push(info);

        } catch (err) {
            console.log(err.message);
        }
    }

    return eligibilityInfo;
}


