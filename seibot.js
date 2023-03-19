import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import {getSigningClient, getQueryClient} from "@sei-js/core";
import { calculateFee  } from "@cosmjs/stargate";


export const seiFunctionBot = async (newMnemonics) => {
    const restEndPoint = 'https://rest.atlantic-2.seinetwork.io/';
    const rpcEndPoint = 'https://rpc.atlantic-2.seinetwork.io/';
    const fee = calculateFee(100000, "0.02usei");

    for (let j=0;j<=2000;j++) {

        for (let i = 0; i < newMnemonics.length; i += 2) {
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

                const queryClient = await getQueryClient(restEndPoint);

                const client1 = await getSigningClient(rpcEndPoint, wallet1);
                const client2 = await getSigningClient(rpcEndPoint, wallet2);

                const wallet1Balances = await queryClient.cosmos.bank.v1beta1
                    .allBalances({address: firstAccountWallet1.address});

                const wallet2Balances = await queryClient.cosmos.bank.v1beta1
                    .allBalances({address: firstAccountWallet2.address});

                const wallet1SeiBalance = wallet1Balances.balances.find(token => token.denom === 'usei')?.amount || '0';
                const wallet2SeiBalance = wallet2Balances.balances.find(token => token.denom === 'usei')?.amount || '0';

                if (parseInt(wallet1SeiBalance) > 3000) {
                    const amount = {
                        amount: String(parseInt(wallet1SeiBalance) - 2000),
                        denom: 'usei'
                    };
                    try {
                        await client1.sendTokens(firstAccountWallet1.address, firstAccountWallet2.address, [amount], fee);
                    } catch (err) {
                        console.error(`Error occurred while sending tokens from wallet ${firstAccountWallet1.address} to ${firstAccountWallet2.address}: ${err.message}`);
                    }
                } else if (parseInt(wallet2SeiBalance) > 3000) {
                    const amount = {
                        amount: String(parseInt(wallet2SeiBalance) - 2000),
                        denom: 'usei'
                    };
                    try {
                        await client2.sendTokens(firstAccountWallet2.address, firstAccountWallet1.address, [amount], fee);
                    } catch (err) {
                        console.error(`Error occurred while sending tokens from wallet ${firstAccountWallet2.address} to ${firstAccountWallet1.address}: ${err.message}`);
                    }
                } else {
                    console.log('Dont have a balance');
                }

            } catch (err) {
                console.log(err);
            }

            console.log(`Done wallets: ${i} ${i+1}`);
        }

        console.log(`Done iteration ${j}`);
    }

    //TODO: Add sending function
}