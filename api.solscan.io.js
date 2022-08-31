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

const blockCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    try {
        // check list
        const {data} = await axios.get(`${solscanEndpoint}/block/last?q=1`);
        if (!data || !data[0]) {
            errors.push(`[Solscan Block API] Failed to get the latest block. Response data is ${JSON.stringify(data)}`);
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
            const {data} = await axios.get(`${solscanEndpoint}/block?block=${currentSlot}`);
            if (!data) {
                errors.push(`[Solscan Block API] Failed to get info of block ${currentSlot}. Response data is ${JSON.stringify(data)}`);
            } else {
                console.log("[Solscan Block API] Get info of the latest block success.");
            }
        }

    } catch (err) {
        errors.push(`[Solscan Block API] Solscan Block API is down: ${err}`);
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

    try {
        const {data} = await axios.get(`${solscanEndpoint}/transaction/last?q=20`);
        if (!data || !data[0]) {
            errors.push(`[Solscan Transaction API] Failed to get last 20 transactions. Response data is ${JSON.stringify(data)}`);
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
        const {data: oldTxDetail} = await axios.get(
            `${solscanEndpoint}/transaction?tx=${SAMPLE_OLD_TRANSACTION}`
        );
        if (!oldTxDetail || oldTxDetail.txHash !== SAMPLE_OLD_TRANSACTION) {
            errors.push(`[Solscan Transaction API] Failed to get detail of an old transaction. TxHash: ${SAMPLE_OLD_TRANSACTION}. TxDetail: ${JSON.stringify(oldTxDetail)}`);
        } else {
            console.log("[Solscan Transaction API] Get old transaction detail success.");
        }

        // check transaction detail API
        if (latestTxHash) {
            const {data: txDetail} = await axios.get(
                `${solscanEndpoint}/transaction?tx=${latestTxHash}`
            );
            if (!txDetail || txDetail.txHash !== latestTxHash) {
                errors.push(`[Solscan Transaction API] Failed to get detail of the latest transaction. TxHash: ${latestTxHash}. TxDetail: ${JSON.stringify(txDetail)}`);
            } else {
                console.log("[Solscan Transaction API] Get the latest transaction detail success.");
            }


            // check transaction overview
            const {data: overview} = await axios.get(
                `${solscanEndpoint}/transaction/overview?tx=${latestTxHash}`
            );

            if (!overview || overview.txHash !== latestTxHash) {
                errors.push(`[Solscan Transaction API] Failed to get overview of transaction ${latestTxHash}. Response data is ${JSON.stringify(overview)}`);
            } else {
                console.log("[Solscan Transaction API] Get overview of latest transaction success.");
            }

            // check transaction status
            const {data: status} = await axios.get(
                `${solscanEndpoint}/transaction/status?tx=${latestTxHash}`
            );
            if (!status || !status.success) {
                errors.push(`[Solscan Transaction API] Failed to get status of transaction ${latestTxHash}. Response data is ${JSON.stringify(status)}`);
            } else {
                console.log("[Solscan Transaction API] Get status of latest transaction success.");
            }
        }
    } catch (err) {
        errors.push(`[Solscan Transaction API] Solscan Transaction API is down: ${err}`);
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
        const {data} = await axios.get(
            `${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}`
        );

        if (!data || !data.data) {
            errors.push(`[Solscan Account API] Failed to get SplTransfer of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get SplTransfer of account ${SAMPLE_ADDRESS} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get SplTransfer of account ${SAMPLE_ADDRESS}: ${err}`);
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
        const {data} = await axios.get(
            `${solscanEndpoint}/account/soltransfer/txs?address=${SAMPLE_ADDRESS}`
        );

        if (!data || !data.data) {
            errors.push(`[Solscan Account API] Failed to get SolTransfer of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get SolTransfer of account ${SAMPLE_ADDRESS} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get SolTransfer of account ${SAMPLE_ADDRESS}: ${err}`);
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
        const {data: wallet} = await axios.get(
            `${solscanEndpoint}/account?address=${SAMPLE_ADDRESS}`
        );
        if (!wallet || !wallet.succcess || !wallet.data) {
            errors.push(`[Solscan Account API] Failed to get info of wallet account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(wallet)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample wallet success.`);
        }

        // token
        check_token = SAMPLE_TOKEN;
        const {data: token} = await axios.get(
            `${solscanEndpoint}/account?address=${SAMPLE_TOKEN}`
        );
        if (!token || !token.succcess || !token.data) {
            errors.push(`[Solscan Account API] Failed to get info of token account ${SAMPLE_TOKEN}. Response data is ${JSON.stringify(token)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample token success.`);
        }

        // token account
        check_token = SAMPLE_ACC_ADDR_TOKEN_ACC;
        const {data: token_acc} = await axios.get(
            `${solscanEndpoint}/account?address=${SAMPLE_ACC_ADDR_TOKEN_ACC}`
        );
        if (!token_acc || !token_acc.succcess || !token_acc.data) {
            errors.push(`[Solscan Account API] Failed to get info of account token ${SAMPLE_ACC_ADDR_TOKEN_ACC}. Response data is ${JSON.stringify(token_acc)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample token account success.`);
        }

        // program
        check_token = SAMPLE_ACC_ADDR_PROGRAM;
        const {data: program} = await axios.get(
            `${solscanEndpoint}/account?address=${SAMPLE_ACC_ADDR_PROGRAM}`
        );
        if (!program || !program.succcess || !program.data) {
            errors.push(`[Solscan Account API] Failed to get info of program account ${SAMPLE_ACC_ADDR_PROGRAM}. Response data is ${JSON.stringify(program)}`);
        } else {
            console.log(`[Solscan Account API] Get info of sample program success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get info of account ${check_token}: ${err}`);
    }

    // check account tokens
    try {
        const {data: acc_tokens} = await axios.get(
            `${solscanEndpoint}/account/tokens?address=${SAMPLE_ADDRESS}`
        );
        if (!acc_tokens || !acc_tokens.succcess) {
            errors.push(`[Solscan Account API] Failed to get tokens of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(acc_tokens)}`);
        } else {
            console.log(`[Solscan Account API] Get tokens of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get tokens of account ${SAMPLE_ADDRESS}: ${err}`);
    }

    // check account transaction
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/account/transaction?address=${SAMPLE_ADDRESS}`
        );
        if (!data || !data.succcess) {
            errors.push(`[Solscan Account API] Failed to get transactions of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get transaction of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get transactions of account ${SAMPLE_ADDRESS}: ${err}`);
    }

    // check account stake
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/account/stake?address=${SAMPLE_STAKE_ACC}`
        );
        if (!data || !data.success) {
            errors.push(`[Solscan Account API] Failed to get stake of account ${SAMPLE_STAKE_ACC}. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get stake of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get stake of account ${SAMPLE_STAKE_ACC}: ${err}`);
    }

    // check account token txs
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}&token_address=${SAMPLE_TOKEN}`
        );
        if (!data || !data.succcess) {
            errors.push(`[Solscan Account API] Failed to get txs token ${SAMPLE_TOKEN} of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get txs token of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get txs token ${SAMPLE_TOKEN} of account ${SAMPLE_ADDRESS}: ${err}`);
    }

    // check account transaction token
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/account/transaction/token?address=${SAMPLE_STAKE_ACC}`
        );
        if (!data || !data.succcess) {
            errors.push(`[Solscan Account API] Failed to get token transactions of account ${SAMPLE_STAKE_ACC}. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API] Get token transactions of sample account success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API] Failed to get token transactions of account ${SAMPLE_STAKE_ACC}: ${err}`);
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
        const {data} = await axios.get(
            `${solscanEndpoint}/tokens?offset=0&limit=5&sortby=market_cap&sorttype=desc`
        );
        if (
            !data ||
            !data.succcess ||
            !data.data ||
            !data.data.tokens ||
            !data.data.tokens[0] ||
            !data.data.tokens[0].mintAddress
        ) {
            errors.push(`[Solscan Token API] Failed to get TokenList. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Token API] Get last 5 tokens success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get TokenList: ${err}`);
    }

    // check meta
    try {
        const {data: meta} = await axios.get(
            `${solscanEndpoint}/token/meta?token=${SAMPLE_TOKEN}`
        );

        if (!meta || !meta.succcess) {
            errors.push(`[Solscan Token API] Failed to get meta of token ${SAMPLE_TOKEN}. Response data is ${JSON.stringify(meta)}`);
        } else {
            console.log(`[Solscan Token API] Get meta of token ${SAMPLE_TOKEN} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get meta of token ${SAMPLE_TOKEN}: ${err}`);
    }

    // check holders
    try {
        const {data: holders} = await axios.get(
            `${solscanEndpoint}/token/holders?offset=0&size=10&token=${SAMPLE_TOKEN}`
        );

        if (!holders || !holders.succcess) {
            errors.push(`[Solscan Token API] Failed to get holders of token ${SAMPLE_TOKEN}. Response data is ${JSON.stringify(holders)}`);
        } else {
            console.log(`[Solscan Token API] Get token holders success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get holders of token ${SAMPLE_TOKEN}: ${err}`);
    }

    // check holder statistic
    try {
        const {data: holderStatistic} = await axios.get(
            `${solscanEndpoint}/token/holder/statistic/total?tokenAddress=${SAMPLE_TOKEN}`
        );

        if (!holderStatistic || !holderStatistic.succcess) {
            errors.push(`[Solscan Token API] Failed to get holder statistic of token ${SAMPLE_TOKEN}. Response data is ${JSON.stringify(holderStatistic)}`);
        } else {
            console.log(`[Solscan Token API] Get holder statistic of token ${SAMPLE_TOKEN} success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API] Failed to get holders of token ${SAMPLE_TOKEN}: ${err}`);
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
        const {data} = await axios.get(`${solscanEndpoint}/amm/all`);
        if (!data || !data.data || !data.data[0] || !data.data[0].address) {
            errors.push(`[Solscan AMM API] Failed to get all AMMs. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get all AMMs success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get all AMMs: ${err}`);
    }

    // check reads
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/amm/reads?source=raydium&keyword=sol&offset=0&limit=1`
        );
        if (
            !data ||
            !data.data ||
            !data.data.items ||
            !data.data.items[0] ||
            !data.data.items[0].address
        ) {
            errors.push(`[Solscan AMM API] Failed to get AMM detail. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get AMM detail success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get AMM: ${err}`);
    }

    // check pairs
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/amm/pairs?source=raydium`
        );
        if (
            !data ||
            !data.data ||
            !data.data.items ||
            !data.data.items[0] ||
            !data.data.items[0].address
        ) {
            errors.push(`[Solscan AMM API] Failed to get pairs of raydium. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get pairs of raydium success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get pairs of raydium: ${err}`);
    }

    // check read
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/amm/read?address=${SAMPLE_ADDRESS_FOR_AMM}`
        );
        if (!data || !data.data || !data.data.address) {
            errors.push(`[Solscan AMM API] Failed to get detail of pair ${SAMPLE_ADDRESS_FOR_AMM}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API] Get detail of sample pair success.`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API] Failed to get detail of pair ${SAMPLE_ADDRESS_FOR_AMM}: ${err}`);
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
        const {data} = await axios.get(
            `${solscanEndpoint}/nft/market/trade?offset=0&limit=1`
        );
        if (!data || !data.data || !data.data[0] || !data.data[0].tradeTime) {
            errors.push(`[Solscan NFT API] Failed to get NFT trades. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get NFT trades success.`);
        }
        latestTrade = data.data[0];
    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get NFT trades ${err}`);
    }

    if (latestTrade) {
        let now = Date.now() / 1000;
        if (now - latestTrade.tradeTime > timeThreshold) {
            errors.push(`[Solscan NFT API] No NFT trades since ${formatDistance(
                latestTrade.tradeTime * 1000,
                new Date(),
                {
                    addSuffix: true,
                }
            )} (${new Date(latestTrade.tradeTime * 1000).toLocaleTimeString(
                "en-US"
            )})`);
        }
    }

    // check nft collections
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/collection?sortBy=volume`
        );
        if (
            !data ||
            !data.success ||
            !data.data ||
            !data.data[0]
        ) {
            errors.push(`[Solscan NFT API] Failed to get NFT collections ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get NFT collections success.`);
        }

    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get NFT collections: ${err}`);
    }

    // check new nft
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/nft?sortBy=createdTime`
        );
        if (
            !data ||
            !data.data ||
            !data.success ||
            !data.data[0] ||
            !data.data[0].info ||
            !data.data[0].info.createdTime
        ) {
            errors.push(`[Solscan NFT API] Failed to get new NFTs. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get new NFTs success.`);
        }
        newNFT = data.data[0].info;
    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get new NFTs: ${err}`);
    }
    if (newNFT) {
        let now = Date.now() / 1000;
        if (now - newNFT.createdTime > timeThreshold) {
            errors.push(`[Solscan NFT API] No new NFTs since ${formatDistance(
                newNFT.createdTime * 1000,
                new Date(),
                {
                    addSuffix: true,
                }
            )} (${new Date(newNFT.createdTime * 1000).toLocaleTimeString("en-US")})`);
        }
    }


    // check all nfts
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/nft?sortBy=tradeTime`
        );
        if (
            !data ||
            !data.data ||
            !data.data[0]
        ) {
            errors.push(`[Solscan NFT API] Failed to get all NFTs. Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API] Get all NFTs success.`);
        }
    } catch (err) {
        errors.push(`[Solscan NFT API] Failed to get all NFTs: ${err}`);
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
        const {data} = await axios.get(
            `${solscanEndpoint}/validator/list?offset=0&limit=20`
        );
        if (!data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API] Failed to get list validators. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API] Get list validators success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API] Failed to get list validators: ${err}`);
    }

    // check version
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/validator/version`
        );
        if (!data || !data.data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API] Failed to get validator version. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API] Get validator version success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API] Failed to get validator version: ${err}`);
    }

    // check leader schedule
    try {
        const {data} = await axios.get(
            `${solscanEndpoint}/validator/leader_schedule?offset=0&limit=10`
        );
        if (!data || !data.data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API] Failed to get leader schedule. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API] Get leader schedule success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API] Failed to get leader schedule: ${err}`);
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
        timeThreshold: 30 * 60, // if no new block in 1800 seconds (30min), alert
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
