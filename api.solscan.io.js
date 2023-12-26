const axios = require("axios").default;
const {formatDistance} = require("date-fns");

// **********************
// PLEASE VERIFY CHECK_LIST
// **********************

const {OK, ERROR} = require("./status");

// const SAMPLE_ADDRESS = `2qzTURMGo9gVdwYyCbyiTrvyDCvLNDaRPkiWefdnmExb`;  // wallet
const SAMPLE_STAKE_ACC = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const SAMPLE_ADDRESS = SAMPLE_STAKE_ACC;
const SAMPLE_ACC_ADDR_TOKEN_ACC = 'FGETo8T8wMcN2wCjav8VK6eh3dLk63evNDPxzLSJra8B'; // USDC of 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
const SAMPLE_ACC_ADDR_PROGRAM = 'LendZqTs7gn5CTSJU1jWKhKuVpjJGom45nnwPb2AMTi'; // Lending program
const SAMPLE_TOKEN = `SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt`; // SRM
const SAMPLE_OLD_TRANSACTION = '2cbw5sBvusbsmV2GKe9JLPivug2jvL6k1hWkxBhWYC5jUmpkyyFn673uM8xeMvrhpcbRTv53rkYkMaLafF6QYDBo';
const SAMPLE_ADDRESS_FOR_AMM = '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2';  // SOL-USDC pair
const RETRY = 3;

const request = async (url) => {
    return await axios.get(url);
}

const getData = async (url) => {
    let result = null;
    let count = 0;
    while (result === null && count < RETRY) {
        try {
            let data = await request(url);
            if (data) {
                result = data;
            } else {
                count += 1;
            }
        } catch (err) {
            count += 1;
            if (count >= RETRY) {
                throw err;
            }
        }
    }
    return result;
}

const blockCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    let blockUrl = "";
    try {
        // check list
        blockUrl = `${solscanEndpoint}/block/last?q=1`;
        const {data} = await getData(blockUrl);
        if (!data || !data.success || !data.data) {
            errors.push(`[Solscan Block API] Failed to get the latest block (${blockUrl}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log("[Solscan Block API] Get the latest block success.");
        }

        let latestBlock = data[0];
        let currentSlot;

        if (latestBlock) {
            currentSlot = latestBlock.currentSlot;

            // check time of the latest block
            let now = Date.now() / 1000;
            if (now - latestBlock.result.blockTime > timeThreshold) {
                errors.push(`[Solscan Block API] No new block since ${formatDistance(
                    latestBlock.result.blockTime * 1000,
                    new Date(),
                    {
                        addSuffix: true,
                    }
                )} (${new Date(latestBlock.result.blockTime * 1000).toLocaleTimeString(
                    "en-US"
                )}). LatestBlock: ${latestBlock.result.blockHeight}`);
            }
        }

        // check block detail
        if (currentSlot) {
            blockUrl = `${solscanEndpoint}/block?block=${currentSlot}`;
            const {data} = await getData(blockUrl);
            if (!data) {
                errors.push(`[Solscan Block API] Failed to get info of block (${blockUrl}). Response data is ${JSON.stringify(data)}`);
            } else {
                console.log("[Solscan Block API] Get info of the latest block success.");
            }
        }
    } catch (err) {
        errors.push(`[Solscan Block API] API failed (${blockUrl}). Error: ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const transactionCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    let txUrl = "";
    try {
        txUrl = `${solscanEndpoint}/transaction/last?q=10`;
        const {data} = await getData(txUrl);
        if (!data || !data.success || !data.data) {
            errors.push(`[Solscan Transaction API] Failed to get last transactions (${txUrl}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log("[Solscan Transaction API] Get last 20 transactions success.");
        }

        let latestTx;
        if (data) {
            latestTx = data[19];
        }

        let latestTxHash;
        if (latestTx) {
            latestTxHash = latestTx.txHash;

            let now = Date.now() / 1000;
            if (now - latestTx.blockTime > timeThreshold) {
                errors.push(`[Solscan Transaction API] No new transaction since ${formatDistance(
                    latestTx.blockTime * 1000,
                    new Date(),
                    {
                        addSuffix: true,
                    }
                )} (${new Date(latestTx.blockTime * 1000).toLocaleTimeString(
                    "en-US"
                )})`);
            }
        }

        // check a random old transaction
        txUrl = `${solscanEndpoint}/transaction?tx=${SAMPLE_OLD_TRANSACTION}`;
        const {data: oldTxDetail} = await getData(txUrl);
        if (!oldTxDetail || !oldTxDetail.success) {
            errors.push(`[Solscan Transaction API] Failed to get detail of an old transaction (${txUrl}). TxDetail: ${JSON.stringify(oldTxDetail)}`);
        } else {
            console.log("[Solscan Transaction API] Get old transaction detail success.");
        }

        // check transaction detail API
        if (latestTxHash) {
            txUrl = `${solscanEndpoint}/transaction?tx=${latestTxHash}`;
            const {data: txDetail} = await getData(txUrl);
            if (!txDetail || !txDetail.success) {
                errors.push(`[Solscan Transaction API] Failed to get detail of the latest transaction (${txUrl}). Response: ${JSON.stringify(txDetail)}`);
            } else {
                console.log("[Solscan Transaction API] Get the latest transaction detail success.");
            }


            // check transaction overview
            txUrl = `${solscanEndpoint}/transaction/overview?tx=${latestTxHash}`;
            const {data: overview} = await getData(txUrl);

            if (!overview || !overview.success) {
                errors.push(`[Solscan Transaction API] Failed to get overview of transaction (${txUrl}). Response data is ${JSON.stringify(overview)}`);
            } else {
                console.log("[Solscan Transaction API] Get overview of latest transaction success.");
            }

            // check transaction status
            txUrl = `${solscanEndpoint}/transaction/status?tx=${latestTxHash}`;
            const {data: status} = await getData(txUrl);
            if (!status || !status.success) {
                errors.push(`[Solscan Transaction API] Failed to get status of transaction (${txUrl}). Response data is ${JSON.stringify(status)}`);
            } else {
                console.log("[Solscan Transaction API] Get status of latest transaction success.");
            }
        }
    } catch (err) {
        errors.push(`[Solscan Transaction API] API failed (${txUrl}). Error: ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const splTransferCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}`
        );

        if (!data || !data.success) {
            errors.push(`[Solscan Account API] Failed to get SplTransfer of account (${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get SplTransfer of account ${SAMPLE_ADDRESS} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get SplTransfer of account (${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}): ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const solTransferCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/soltransfer/txs?address=${SAMPLE_ADDRESS}`
        );

        if (!data || !data.success) {
            errors.push(`[Solscan Account API] Failed to get SolTransfer of account (${solscanEndpoint}/account/soltransfer/txs?address=${SAMPLE_ADDRESS}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get SolTransfer of account ${SAMPLE_ADDRESS} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get SolTransfer of account (${solscanEndpoint}/account/soltransfer/txs?address=${SAMPLE_ADDRESS}): ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const accountCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check account info
    let check_token = '';
    try {
        // wallet
        check_token = SAMPLE_ADDRESS;
        const {data: wallet} = await getData(
            `${solscanEndpoint}/account?address=${SAMPLE_ADDRESS}`
        );
        if (!wallet || !wallet.success || !wallet.data) {
            errors.push(`[Solscan Account API] Failed to get info of wallet account (${solscanEndpoint}/account?address=${SAMPLE_ADDRESS}). Response data is ${JSON.stringify(wallet)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample wallet success.`);
        }

        // token
        check_token = SAMPLE_TOKEN;
        const {data: token} = await getData(
            `${solscanEndpoint}/account?address=${SAMPLE_TOKEN}`
        );
        if (!token || !token.success || !token.data) {
            errors.push(`[Solscan Account API] Failed to get info of token account (${solscanEndpoint}/account?address=${SAMPLE_TOKEN}). Response data is ${JSON.stringify(token)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample token success.`);
        }

        // token account
        check_token = SAMPLE_ACC_ADDR_TOKEN_ACC;
        const {data: token_acc} = await getData(
            `${solscanEndpoint}/account?address=${SAMPLE_ACC_ADDR_TOKEN_ACC}`
        );
        if (!token_acc || !token_acc.success || !token_acc.data) {
            errors.push(`[Solscan Account API] Failed to get info of account token (${solscanEndpoint}/account?address=${SAMPLE_ACC_ADDR_TOKEN_ACC}). Response data is ${JSON.stringify(token_acc)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample token account success.`);
        }

        // program
        check_token = SAMPLE_ACC_ADDR_PROGRAM;
        const {data: program} = await getData(
            `${solscanEndpoint}/account?address=${SAMPLE_ACC_ADDR_PROGRAM}`
        );
        if (!program || !program.success || !program.data) {
            errors.push(`[Solscan Account API] Failed to get info of program account (${solscanEndpoint}/account?address=${SAMPLE_ACC_ADDR_PROGRAM}). Response data is ${JSON.stringify(program)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample program success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get info of account (${solscanEndpoint}/account?address=${SAMPLE_ACC_ADDR_PROGRAM}). Error: ${err}`);
    }

    // check account tokens
    try {
        const {data: acc_tokens} = await getData(
            `${solscanEndpoint}/account/tokens?address=${SAMPLE_ADDRESS}`
        );
        if (!acc_tokens || !acc_tokens.success) {
            errors.push(`[Solscan Account API] Failed to get tokens of account (${solscanEndpoint}/account/tokens?address=${SAMPLE_ADDRESS}). Response: ${JSON.stringify(acc_tokens)}`);
        } else {
            console.log(`[Solscan Account API] Get tokens of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get tokens of account (${solscanEndpoint}/account/tokens?address=${SAMPLE_ADDRESS}). Error: ${err}`);
    }

    // check account transaction
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/transaction?address=${SAMPLE_ADDRESS}`
        );
        if (!data || !data.success) {
            errors.push(`[Solscan Account API] Failed to get transactions of account (${solscanEndpoint}/account/transaction?address=${SAMPLE_ADDRESS}). Response: ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get transaction of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get transactions of account (${solscanEndpoint}/account/transaction?address=${SAMPLE_ADDRESS}). Error: ${err}`);
    }

    // check account stake
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/stake?address=${SAMPLE_STAKE_ACC}`
        );
        if (!data || !data.success) {
            errors.push(`[Solscan Account API] Failed to get stake of account (${solscanEndpoint}/account/stake?address=${SAMPLE_STAKE_ACC}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get stake of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get stake of account (${solscanEndpoint}/account/stake?address=${SAMPLE_STAKE_ACC}). Error: ${err}`);
    }

    // check account token txs
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}&token_address=${SAMPLE_TOKEN}`
        );
        if (!data || !data.success) {
            errors.push(`[Solscan Account API] Failed to get txs token of account (${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}&token_address=${SAMPLE_TOKEN}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get txs token of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get txs token of account (${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}&token_address=${SAMPLE_TOKEN}): ${err}`);
    }

    // check account transaction token
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/transaction/token?address=${SAMPLE_STAKE_ACC}`
        );
        if (!data || !data.success) {
            errors.push(`[Solscan Account API] Failed to get token transactions of account (${solscanEndpoint}/account/transaction/token?address=${SAMPLE_STAKE_ACC}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get token transactions of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get token transactions of account (${solscanEndpoint}/account/transaction/token?address=${SAMPLE_STAKE_ACC}). Error: ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const tokenCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    try {
        // check list
        const {data} = await getData(
            `${solscanEndpoint}/tokens?offset=0&limit=5&sortby=market_cap&sorttype=desc`
        );
        if (
            !data ||
            !data.success ||
            !data.data ||
            !data.data.tokens ||
            !data.data.tokens[0] ||
            !data.data.tokens[0].mintAddress
        ) {
            errors.push(`[Solscan Token API] Failed to get TokenList (${solscanEndpoint}/tokens?offset=0&limit=5&sortby=market_cap&sorttype=desc). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Token API] Get last 5 tokens success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get TokenList (${solscanEndpoint}/tokens?offset=0&limit=5&sortby=market_cap&sorttype=desc). Error: ${err}`);
    }

    // check meta
    try {
        const {data: meta} = await getData(
            `${solscanEndpoint}/token/meta?token=${SAMPLE_TOKEN}`
        );

        if (!meta || !meta.success) {
            errors.push(`[Solscan Token API] Failed to get meta of token (${solscanEndpoint}/token/meta?token=${SAMPLE_TOKEN}). Response data is ${JSON.stringify(meta)}`);
        } else {
            console.log(`[Solscan Token API] Get meta of token ${SAMPLE_TOKEN} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get meta of token (${solscanEndpoint}/token/meta?token=${SAMPLE_TOKEN}): ${err}`);
    }

    // check holders
    try {
        const {data: holders} = await getData(
            `${solscanEndpoint}/token/holders?offset=0&size=10&token=${SAMPLE_TOKEN}`
        );

        if (!holders || !holders.success) {
            errors.push(`[Solscan Token API] Failed to get holders of token (${solscanEndpoint}/token/holders?offset=0&size=10&token=${SAMPLE_TOKEN}). Response data is ${JSON.stringify(holders)}`);
        } else {
            console.log(`[Solscan Token API] Get token holders success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get holders of token (${solscanEndpoint}/token/holders?offset=0&size=10&token=${SAMPLE_TOKEN}): ${err}`);
    }

    // check holder statistic
    try {
        const {data: holderStatistic} = await getData(
            `${solscanEndpoint}/token/holder/statistic/total?tokenAddress=${SAMPLE_TOKEN}`
        );

        if (!holderStatistic || !holderStatistic.success) {
            errors.push(`[Solscan Token API] Failed to get holder statistic of token (${solscanEndpoint}/token/holder/statistic/total?tokenAddress=${SAMPLE_TOKEN}). Response data is ${JSON.stringify(holderStatistic)}`);
        } else {
            console.log(`[Solscan Token API] Get holder statistic of token ${SAMPLE_TOKEN} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get holders of token (${solscanEndpoint}/token/holder/statistic/total?tokenAddress=${SAMPLE_TOKEN}): ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const defiCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check all
    try {
        const {data} = await getData(`${solscanEndpoint}/amm/all`);
        if (!data || !data.data || !data.data[0] || !data.data[0].address) {
            errors.push(`[Solscan AMM API] Failed to get all AMMs (${solscanEndpoint}/amm/all). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get all AMMs success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get all AMMs (${solscanEndpoint}/amm/all). Error: ${err}`);
    }

    // check reads
    try {
        const {data} = await getData(
            `${solscanEndpoint}/amm/reads?source=raydium&keyword=sol&offset=0&limit=1`
        );
        if (
            !data ||
            !data.data ||
            !data.data.items ||
            !data.data.items[0] ||
            !data.data.items[0].address
        ) {
            errors.push(`[Solscan AMM API] Failed to get AMM detail (${solscanEndpoint}/amm/reads?source=raydium&keyword=sol&offset=0&limit=1). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get AMM detail success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get AMM (${solscanEndpoint}/amm/reads?source=raydium&keyword=sol&offset=0&limit=1). Error: ${err}`);
    }

    // check pairs
    try {
        const {data} = await getData(
            `${solscanEndpoint}/amm/pairs?source=raydium`
        );
        if (
            !data ||
            !data.data ||
            !data.data.items ||
            !data.data.items[0] ||
            !data.data.items[0].address
        ) {
            errors.push(`[Solscan AMM API] Failed to get pairs of raydium (${solscanEndpoint}/amm/pairs?source=raydium). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get pairs of raydium success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get pairs of raydium (${solscanEndpoint}/amm/pairs?source=raydium). Error: ${err}`);
    }

    // check read
    try {
        const {data} = await getData(
            `${solscanEndpoint}/amm/read?address=${SAMPLE_ADDRESS_FOR_AMM}`
        );
        if (!data || !data.data || !data.data.address) {
            errors.push(`[Solscan AMM API] Failed to get detail of pair (${solscanEndpoint}/amm/read?address=${SAMPLE_ADDRESS_FOR_AMM}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get detail of sample pair success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get detail of pair (${solscanEndpoint}/amm/read?address=${SAMPLE_ADDRESS_FOR_AMM}). Error: ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const nftCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    let latestTrade;
    let newNFT;

    // check nft trade
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/market/trade?offset=0&limit=1`
        );
        if (!data || !data.success) {
            errors.push(`[Solscan NFT API] Failed to get NFT trades (${solscanEndpoint}/nft/market/trade?offset=0&limit=1). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get NFT trades success.`);
        }
    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get NFT trades (${solscanEndpoint}/nft/market/trade?offset=0&limit=1). Error: ${err}`);
    }

    // if (latestTrade) {
    //     let now = Date.now() / 1000;
    //     if (now - latestTrade.tradeTime > timeThreshold) {
    //         errors.push(`[Solscan NFT API] No NFT trades since ${formatDistance(
    //             latestTrade.tradeTime * 1000,
    //             new Date(),
    //             {
    //                 addSuffix: true,
    //             }
    //         )} (${new Date(latestTrade.tradeTime * 1000).toLocaleTimeString(
    //             "en-US"
    //         )})`);
    //     }
    // }

    // check nft collections
    try {
        const {data} = await getData(
            `${solscanEndpoint}/collection?sortBy=volume`
        );
        if (!data || !data.success) {
            errors.push(`[Solscan NFT API] Failed to get NFT collections (${solscanEndpoint}/collection?sortBy=volume). Data: ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get NFT collections success.`);
        }

    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get NFT collections (${solscanEndpoint}/collection?sortBy=volume). Error: ${err}`);
    }

    // check new nft
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft?sortBy=createdTime`
        );
        if (
            !data ||
            !data.data ||
            !data.success ||
            !data.data[0] ||
            !data.data[0].info
        ) {
            errors.push(`[Solscan NFT API] Failed to get new NFTs (${solscanEndpoint}/nft?sortBy=createdTime). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get new NFTs success.`);
        }
    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get new NFTs (${solscanEndpoint}/nft?sortBy=createdTime). Error: ${err}`);
    }

    // check all nfts
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft?sortBy=tradeTime`
        );
        if (
            !data ||
            !data.data ||
            !data.data[0]
        ) {
            errors.push(`[Solscan NFT API] Failed to get all NFTs (${solscanEndpoint}/nft?sortBy=tradeTime). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get all NFTs success.`);
        }
    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get all NFTs (${solscanEndpoint}/nft?sortBy=tradeTime). Error: ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    };
};

const validatorCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check list
    try {
        const {data} = await getData(
            `${solscanEndpoint}/validator/list?offset=0&limit=20`
        );
        if (!data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API] Failed to get list validators (${solscanEndpoint}/validator/list?offset=0&limit=20). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API] Get list validators success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API] Failed to get list validators (${solscanEndpoint}/validator/list?offset=0&limit=20). Error: ${err}`);
    }

    // check version
    try {
        const {data} = await getData(
            `${solscanEndpoint}/validator/version`
        );
        if (!data || !data.data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API] Failed to get validator version (${solscanEndpoint}/validator/version). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API] Get validator version success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API] Failed to get validator version (${solscanEndpoint}/validator/version). Error: ${err}`);
    }

    // check leader schedule
    try {
        const {data} = await getData(
            `${solscanEndpoint}/validator/leader_schedule?offset=0&limit=10`
        );
        if (!data || !data.data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API] Failed to get leader schedule (${solscanEndpoint}/validator/leader_schedule?offset=0&limit=10). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API] Get leader schedule success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API] Failed to get leader schedule (${solscanEndpoint}/validator/leader_schedule?offset=0&limit=10). Error: ${err}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK,
    }
};

const CHECK_LIST = {
    block: {
        healthCheckFunction: blockCheck,
        timeThreshold: 5 * 60, // if no new block in 300 seconds (5min), alert
    },
    transaction: {
        healthCheckFunction: transactionCheck,
        timeThreshold: 5 * 60,
    },
    solTransfer: {
        healthCheckFunction: solTransferCheck,
    },
    splTransfer: {
        healthCheckFunction: splTransferCheck,
    },
    account: {
        healthCheckFunction: accountCheck,
    },
    token: {
        healthCheckFunction: tokenCheck,
    },
    defi: {
        healthCheckFunction: defiCheck,
    },
    nftCheck: {
        healthCheckFunction: nftCheck,
        timeThreshold: 2 * 60 * 60,
    },
    validatorCheck: {
        healthCheckFunction: validatorCheck,
    }
};

const getHealthCheckData = async (
    solscanEndpoint = "https://api.solscan.io"
) => {
    let data = [];
    for (const module in CHECK_LIST) {
        let checker = Object.assign({}, CHECK_LIST[module]);
        let res = await checker["healthCheckFunction"](
            solscanEndpoint,
            checker["timeThreshold"]
        );
        data.push({
            module: module,
            ...res,
        });
    }

    return data;
};

module.exports = {
    getHealthCheckData,
};
