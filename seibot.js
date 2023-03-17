import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import {getSigningClient, getQueryClient} from "@sei-js/core";
import { calculateFee  } from "@cosmjs/stargate";






export const seiFunctionBot = async (newMnemonics) => {
    const restEndPoint = 'https://rest.atlantic-2.seinetwork.io/';
    const rpcEndPoint = 'https://rpc.atlantic-2.seinetwork.io/';

    for (let i=0;i<=newMnemonics.length; i+2) {
        const wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(
            newMnemonics[i],
            {prefix: 'sei'}
        );

        const wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(
            newMnemonics[i+1],
            {prefix: 'sei'}
        );


        const [firstAccountWallet1] = await wallet1.getAccounts();
        const [firstAccountWallet2] = await wallet2.getAccounts();

        const queryClient  = await getQueryClient(restEndPoint);

        const client1 = await getSigningClient(rpcEndPoint, wallet1);
        const client2 = await getSigningClient(rpcEndPoint, wallet2);

        const fee = calculateFee(100000, "0.02usei");


        for (let i = 0; i<50; i++) {
           try {
               const wallet1Balances = await queryClient.cosmos.bank.v1beta1
                   .allBalances({ address: firstAccountWallet1.address });

               const wallet2Balances = await queryClient.cosmos.bank.v1beta1
                   .allBalances({ address: firstAccountWallet2.address });

               const wallet1SeiBalance = wallet1Balances.balances.find(token => token.denom === 'usei');
               const wallet2SeiBalance = wallet2Balances.balances.find(token => token.denom === 'usei');

               if (parseInt(wallet1SeiBalance.amount) > 30000) {
                   const amount = { amount: String(parseInt(wallet1SeiBalance.amount)-15000), denom: wallet1SeiBalance.denom };

                   const resp = await client1.sendTokens(firstAccountWallet1.address, firstAccountWallet2.address, [amount], fee);

                   console.log('TX Wallet1:', resp);
               } else {
                   const amount = { amount: String(parseInt(wallet2SeiBalance.amount)-15000), denom: wallet2SeiBalance.denom };

                   const resp = await client2.sendTokens(firstAccountWallet2.address, firstAccountWallet1.address, [amount], fee);

                   console.log('TX Wallet2:', resp);
               }
           } catch (error) {
               console.log("Error: ", error.message, ' in wallets: ', firstAccountWallet1.address,' ', firstAccountWallet2.address);
           }

        }

        console.log(`Done wallets: ${i} ${i+1}`);
    }
}



