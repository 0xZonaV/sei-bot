import {calculateFee} from "@cosmjs/stargate";
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {getQueryClient, getSigningClient} from "@sei-js/core";




export const everydayBot = async (mnemonics) => {
    const restEndPoint = 'https://rest.atlantic-2.seinetwork.io/';
    const rpcEndPoint = 'https://rpc.atlantic-2.seinetwork.io/';
    const fee = calculateFee(300000, "0.02usei");
    const validatorAddress = 'seivaloper1r35u5wseduv34h77zx88l49dc4s3cmq2wa64t6';

    for (let j=0;j<=3;j++) {
        const transactions = [];

        for (let i = 0; i <= mnemonics.length; i += 2) {
            try {
                const wallet1 = await DirectSecp256k1HdWallet.fromMnemonic(
                    mnemonics[i],
                    {prefix: 'sei'}
                );

                const wallet2 = await DirectSecp256k1HdWallet.fromMnemonic(
                    mnemonics[i + 1],
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

                const wallet1SeiBalance = wallet1Balances.balances.find(token => token.denom === 'usei');
                const wallet2SeiBalance = wallet2Balances.balances.find(token => token.denom === 'usei');



                    if ((parseInt(wallet1SeiBalance?.amount) >= 20001) && (parseInt(wallet2SeiBalance?.amount) >= 20001)) {
                        const amount = {
                            amount: String(20000),
                            denom: wallet1SeiBalance.denom
                        };

                        transactions.push(client1.delegateTokens(firstAccountWallet1.address, validatorAddress, amount, fee));
                        transactions.push(client2.delegateTokens(firstAccountWallet2.address, validatorAddress, amount, fee));
                    } else if (parseInt(wallet1SeiBalance?.amount) >= 20001) {
                        const amount = {
                            amount: String(20000),
                            denom: wallet1SeiBalance.denom
                        };

                        transactions.push(client1.delegateTokens(firstAccountWallet1.address, validatorAddress, amount, fee));
                    }else if (parseInt(wallet2SeiBalance?.amount) >= 20001) {
                        const amount = {
                            amount: String(20000),
                            denom: wallet2SeiBalance.denom
                        };

                        transactions.push(client2.delegateTokens(firstAccountWallet2.address, validatorAddress, amount, fee));

                    } else console.log(`Not enough SEI to delegate ${wallet1SeiBalance?.amount} ${wallet2SeiBalance?.amount}`);

                console.log(`Done wallets: ${i} ${i + 1}`);
            } catch (err) {
                console.log(err);
            }
        }

        await Promise.all(transactions);
    }
}