const axios = require("axios").default;
const {formatDistance} = require("date-fns");

// **********************
// PLEASE VERIFY CHECK_LIST
// **********************

const {OK, ERROR} = require("./status");

// const SAMPLE_ADDRESS = `2qzTURMGo9gVdwYyCbyiTrvyDCvLNDaRPkiWefdnmExb`;  // wallet
const SAMPLE_STAKE_ACC = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const SAMPLE_ADDRESS = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"; // raydium authority v4
const SAMPLE_BALANCE_CHANGE_ADDRESS = "ob2htHLoCu2P6tX7RrNVtiG1mYTas8NGJEVLaFEUngk";
const SAMPLE_ACC_ADDR_TOKEN_ACC = 'FGETo8T8wMcN2wCjav8VK6eh3dLk63evNDPxzLSJra8B'; // USDC of 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
const SAMPLE_ACC_ADDR_PROGRAM = 'LendZqTs7gn5CTSJU1jWKhKuVpjJGom45nnwPb2AMTi'; // Lending program
const SAMPLE_TOKEN = `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`; // JUP
const SAMPLE_OLD_TRANSACTION = '2cbw5sBvusbsmV2GKe9JLPivug2jvL6k1hWkxBhWYC5jUmpkyyFn673uM8xeMvrhpcbRTv53rkYkMaLafF6QYDBo';
const NFT_SAMPLE = '6kuKnYgCqnBS6R35j6qHrgxZz7BTMhHJ9zuwfSdy33VV';
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
            errors.push(`[Solscan Block API-V2] Failed to get the latest block (${blockUrl}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log("[Solscan Block API-V2] Get block latest success.");
        }

        let latestBlock = data.data[0];
        let currentSlot;

        if (latestBlock) {
            currentSlot = latestBlock.currentSlot;

            // check time of the latest block
            let now = Date.now() / 1000;
            if (now - latestBlock.result.blockTime > timeThreshold) {
                errors.push(`[Solscan Block API-V2] No new block since ${formatDistance(
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
            blockUrl = `${solscanEndpoint}/block/detail?block=${currentSlot}`;
            const {data} = await getData(blockUrl);
            if (!data) {
                errors.push(`[Solscan Block API-V2] Failed to get info of block (${blockUrl}). Response data is ${JSON.stringify(data)}`);
            } else {
                console.log("[Solscan Block API-V2] Get block detail success.");
            }
        }
    } catch (err) {
        errors.push(`[Solscan Block API-V2] API failed (${blockUrl}). Error: ${err}`);
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
}

const transactionCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    let txUrl = "";
    try {
        txUrl = `${solscanEndpoint}/transaction/last?q=10`;
        const {data} = await getData(txUrl);
        if (!data || !data.success || !data.data) {
            errors.push(`[Solscan Transaction API-V2] Failed to get last transactions (${txUrl}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log("[Solscan Transaction API-V2] Get transaction last success.");
        }

        let latestTx;
        if (data) {
            latestTx = data.data[0];
        }

        let latestTxHash;
        if (latestTx) {
            latestTxHash = latestTx.txHash;

            let now = Date.now() / 1000;
            if (now - latestTx.blockTime > timeThreshold) {
                errors.push(`[Solscan Transaction API-V2] No new transaction since ${formatDistance(
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

        // check transaction detail API
        if (latestTxHash) {
            txUrl = `${solscanEndpoint}/transaction/detail?tx=${latestTxHash}`;
            const {data: txDetail} = await getData(txUrl);
            if (!txDetail || !txDetail.success) {
                errors.push(`[Solscan Transaction API-V2] Failed to get detail of transaction (${txUrl}). Response: ${JSON.stringify(txDetail)}`);
            } else {
                console.log("[Solscan Transaction API-V2] Get transaction detail success.");
            }

            // check transaction overview
            txUrl = `${solscanEndpoint}/transaction/overview?tx=${latestTxHash}`;
            const {data: overview} = await getData(txUrl);

            if (!overview || !overview.success) {
                errors.push(`[Solscan Transaction API-V2] Failed to get overview of transaction (${txUrl}). Response data is ${JSON.stringify(overview)}`);
            } else {
                console.log("[Solscan Transaction API-V2] Get transaction overview success.");
            }

            // check transaction status
            txUrl = `${solscanEndpoint}/transaction/status?tx=${latestTxHash}`;
            const {data: status} = await getData(txUrl);
            if (!status || !status.success) {
                errors.push(`[Solscan Transaction API-V2] Failed to get status of transaction (${txUrl}). Response data is ${JSON.stringify(status)}`);
            } else {
                console.log("[Solscan Transaction API-V2] Get transaction status success.");
            }
        }
    } catch (err) {
        errors.push(`[Solscan Transaction API-V2] API failed (${txUrl}). Error: ${err}`);
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
}

const accountCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check account info
    const accountDetailEndpoint = `${solscanEndpoint}/account?address=${SAMPLE_ADDRESS}`;
    try {
        // wallet
        const {data: wallet} = await getData(accountDetailEndpoint);
        if (wallet == null || wallet.success !== true || wallet.data == null) {
            errors.push(`[Solscan Account API-V2] Failed to get info of account (${accountDetailEndpoint}). Response data is ${JSON.stringify(wallet)}`);
        } else {
            console.log(`[Solscan Account API-V2] Get account detail success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API-V2] Failed to get info of account (${accountDetailEndpoint}). Error: ${err}`);
    }

    // check account tokens
    const accountTokensEndpoint = `${solscanEndpoint}/account/tokens?address=${SAMPLE_ADDRESS}`;
    try {
        const {data: acc_tokens} = await getData(accountTokensEndpoint);
        if (acc_tokens == null || acc_tokens.success !== true) {
            errors.push(`[Solscan Account API-V2] Failed to get tokens of account (${accountTokensEndpoint}). Response: ${JSON.stringify(acc_tokens)}`);
        } else {
            console.log(`[Solscan Account API-V2] Get account tokens success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API-V2] Failed to get tokens of account (${accountTokensEndpoint}). Error: ${err}`);
    }

    // check account transactions
    const accountTxsEndpoint = `${solscanEndpoint}/account/transaction?address=${SAMPLE_ADDRESS}`;
    try {
        const {data} = await getData(accountTxsEndpoint);
        if (data == null || data.success !== true) {
            errors.push(`[Solscan Account API-V2] Failed to get transactions of account (${accountTxsEndpoint}). Response: ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API-V2] Get account transaction success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API-V2] Failed to get transactions of account (${accountTxsEndpoint}). Error: ${err}`);
    }

    // check account balance changes
    const accountBalanceChangeEndpoint = `${solscanEndpoint}/account/balance_change?address=${SAMPLE_BALANCE_CHANGE_ADDRESS}`;
    try {
        const {data} = await getData(accountBalanceChangeEndpoint);
        if (data == null || data.success !== true || data.data == null) {
            errors.push(`[Solscan Account API-V2] Failed to balance changes of account (${accountBalanceChangeEndpoint}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API-V2] Get account balance changes success.`);
            // check if balance changes is catchup
            let latestTxTime = data.data.transactions[0].block_time;
            let distance = Date.now() / 1000 - latestTxTime;
            if (distance > timeThreshold) {
                errors.push(`[Solscan Account API-V2] No new balance changes since ${formatDistance(
                    latestTxTime * 1000,
                    new Date(),
                    {
                        addSuffix: true,
                    }
                )}`);
            }
        }
    } catch (err) {
        errors.push(`[Solscan Account API-V2] Failed to get balance changes of account (${accountBalanceChangeEndpoint}). Error: ${err}`);
    }

    // check account transfers
    const accountTransferEndpoint = `${solscanEndpoint}/account/transfer?address=${SAMPLE_ADDRESS}`;
    try {
        const {data} = await getData(accountTransferEndpoint);
        if (data == null || data.success !== true || data.data == null) {
            errors.push(`[Solscan Account API-V2] Failed to get transfers of account (${accountTransferEndpoint}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API-V2] Get account transfers success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API-V2] Failed to get transfers of account (${accountTransferEndpoint}). Error: ${err}`);
    }

    // check account defi activities
    const accountDefiActivitiesEndpoint = `${solscanEndpoint}/account/activity/dextrading?address=${SAMPLE_ADDRESS}`;
    try {
        const {data} = await getData(accountDefiActivitiesEndpoint);
        if (data == null || data.success !== true || data.data == null) {
            errors.push(`[Solscan Account API-V2] Failed to get defi activities of account (${accountDefiActivitiesEndpoint}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Account API-V2] Get account defi activities success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Account API-V2] Failed to get defi activities of account (${accountDefiActivitiesEndpoint}). Error: ${err}`);
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
}

const tokenCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check token holders
    const tokenHoldersEndpoint = `${solscanEndpoint}/token/holders?address=${SAMPLE_TOKEN}`;
    try {
        const {data: holders} = await getData(tokenHoldersEndpoint);

        if (!holders || !holders.success || !holders.data || !holders.data.items || !holders.data.items[0]) {
            errors.push(`[Solscan Token API-V2] Failed to get holders of token (${tokenHoldersEndpoint}). Response data is ${JSON.stringify(holders)}`);
        } else {
            console.log(`[Solscan Token API-V2] Get token holders success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API-V2] Failed to get holders of token (${tokenHoldersEndpoint}). Error: ${err}`);
    }

    // check token trending
    const tokenTrendingEndpoint = `${solscanEndpoint}/token/trending`;
    try {
        const {data: trending} = await getData(tokenTrendingEndpoint);

        if (!trending || !trending.success || !trending.data || !trending.data[0]) {
            errors.push(`[Solscan Token API-V2] Failed to get token trending (${tokenTrendingEndpoint}). Response data is ${JSON.stringify(trending)}`);
        } else {
            console.log(`[Solscan Token API-V2] Get token trending success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Token API-V2] Failed to get token trending (${tokenTrendingEndpoint}). Error: ${err}`);
    }

    // check token transfers
    const tokenTransferEndpoint = `${solscanEndpoint}/token/transfer?address=${SAMPLE_TOKEN}&page=1&page_size=10&remove_spam=false&exclude_amount_zero=false`;
    try {
        const {data: transfers} = await getData(tokenTransferEndpoint);

        if (!transfers || !transfers.success || !transfers.data || !transfers.data[0]) {
            errors.push(`[Solscan Token API-V2] Failed to get transfers of token (${tokenTransferEndpoint}). Response data is ${JSON.stringify(transfers)}`);
        } else {
            console.log(`[Solscan Token API-V2] Get token transfers success.`);

            // check time
            let transfer = transfers.data[0];
            let blockTime = transfer.block_time;
            let distance = Date.now() / 1000 - blockTime;
            if (distance > timeThreshold) {
                errors.push(`[Solscan Token API-V2] No new token transfers since ${formatDistance(
                    blockTime * 1000,
                    new Date(),
                    {
                        addSuffix: true,
                    }
                )}`);
            }
        }
    } catch (err) {
        errors.push(`[Solscan Token API-V2] Failed to get transfers of token (${tokenTransferEndpoint}). Error: ${err}`);
    }

    // check token activities
    const tokenDefiActivitiesEndpoint = `${solscanEndpoint}/token/activity/dextrading?address=${SAMPLE_TOKEN}&page=1&page_size=10`;
    try {
        const {data: activities} = await getData(
            tokenDefiActivitiesEndpoint
        );

        if (!activities || !activities.success || !activities.data || !activities.data[0]) {
            errors.push(`[Solscan Token API-V2] Failed to get activities of token (${tokenDefiActivitiesEndpoint}). Response data is ${JSON.stringify(activities)}`);
        } else {
            console.log(`[Solscan Token API-V2] Get token defi activities success.`);

            // check time
            let transfer = activities.data[0];
            let blockTime = transfer.block_time;
            let distance = Date.now() / 1000 - blockTime;
            if (distance > timeThreshold) {
                errors.push(`[Solscan Token API-V2] No new token defi activities since ${formatDistance(
                    blockTime * 1000,
                    new Date(),
                    {
                        addSuffix: true,
                    }
                )}`);
            }
        }
    } catch (err) {
        errors.push(`[Solscan Token API-V2] Failed to get activities of token (${tokenDefiActivitiesEndpoint}). Error: ${err}`);
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
}

const defiCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check amm overview
    const ammOverviewEndpoint = `${solscanEndpoint}/defi/amm/overview?time_range=7`;
    try {
        const {data} = await getData(ammOverviewEndpoint);
        if (!data || !data.success || !data.data) {
            errors.push(`[Solscan AMM API-V2] Failed to get amm overview (${ammOverviewEndpoint}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API-V2] Get amm overview success`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API-V2] Failed to get amm overview (${ammOverviewEndpoint}). Error: ${err}`);
    }

    // check amm overview
    const ammListEndpoint = `${solscanEndpoint}/defi/amm/list`;
    try {
        const {data} = await getData(ammListEndpoint);
        if (!data || !data.success || !data.data) {
            errors.push(`[Solscan AMM API-V2] Failed to get amm list (${ammListEndpoint}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan AMM API-V2] Get amm list success`);
        }
    } catch (err) {
        errors.push(`[Solscan AMM API-V2] Failed to get amm list (${ammOverviewEndpoint}). Error: ${err}`);
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
}

const nftCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check nft collection overview
    const nftOverviewEndpoint = `${solscanEndpoint}/nftcollection/overview_all`
    try {
        const {data} = await getData(nftOverviewEndpoint);
        if (!data || !data.data || !data.success) {
            errors.push(`[Solscan NFT API-V2] Failed to get nft collection overview (${nftOverviewEndpoint}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API-V2] Get nft collection overview success.`);
        }
    } catch (err) {
        errors.push(`[Solscan NFT API-V2] Failed to get nft collection overview (${nftOverviewEndpoint}). Error: ${err}`);
    }

    // check new nft
    const newNftEndpoint = `${solscanEndpoint}/nft/newnft`;
    try {
        const {data} = await getData(newNftEndpoint);
        if (!data || !data.data || !data.success) {
            errors.push(`[Solscan NFT API-V2] Failed to get new NFTs (${newNftEndpoint}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API-V2] Get nft new success.`);
        }
    } catch (err) {
        errors.push(`[Solscan NFT API-V2] Failed to get new NFTs (${newNftEndpoint}). Error: ${err}`);
    }

    // check nft detail
    const nftDetailEndpoint = `${solscanEndpoint}/nft/detail?address=${NFT_SAMPLE}`;
    try {
        const {data} = await getData(nftDetailEndpoint);
        if (!data || !data.success || !data.data) {
            errors.push(`[Solscan NFT API-V2] Failed to get nft detail (${nftDetailEndpoint}). Response data is ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan NFT API-V2] Get nft detail success.`);
        }
    } catch (err) {
        errors.push(`[Solscan NFT API-V2] Failed to get nft detail (${nftDetailEndpoint}). Error: ${err}`);
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
}

const validatorCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // check list
    try {
        const {data} = await getData(
            `${solscanEndpoint}/validator/list?offset=0&limit=20`
        );
        if (!data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API-V2] Failed to get list validators (${solscanEndpoint}/validator/list?offset=0&limit=20). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API-V2] Get list validators success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API-V2] Failed to get list validators (${solscanEndpoint}/validator/list?offset=0&limit=20). Error: ${err}`);
    }

    // check version
    try {
        const {data} = await getData(
            `${solscanEndpoint}/validator/version`
        );
        if (!data || !data.data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API-V2] Failed to get validator version (${solscanEndpoint}/validator/version). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API-V2] Get validator version success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API-V2] Failed to get validator version (${solscanEndpoint}/validator/version). Error: ${err}`);
    }

    // check leader schedule
    try {
        const {data} = await getData(
            `${solscanEndpoint}/validator/leader_schedule?offset=0&limit=10`
        );
        if (!data || !data.data || !data.data || !data.data.items || !data.data.items[0]) {
            errors.push(`[Solscan Validator API-V2] Failed to get leader schedule (${solscanEndpoint}/validator/leader_schedule?offset=0&limit=10). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`[Solscan Validator API-V2] Get leader schedule success.`);
        }
    } catch (err) {
        errors.push(`[Solscan Validator API-V2] Failed to get leader schedule (${solscanEndpoint}/validator/leader_schedule?offset=0&limit=10). Error: ${err}`);
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
}

const CHECK_LIST = {
    account: {
        healthCheckFunction: accountCheck,
        timeThreshold: 5 * 60
    },
    token: {
        healthCheckFunction: tokenCheck,
        timeThreshold: 5 * 60
    },
    block: {
        healthCheckFunction: blockCheck,
        timeThreshold: 5 * 60
    },
    transaction: {
        healthCheckFunction: transactionCheck,
        timeThreshold: 5 * 60
    },
    defi: {
        healthCheckFunction: defiCheck
    },
    nft: {
        healthCheckFunction: nftCheck
    }
}

const checkAPIV2 = async (
    solscanEndpoint = "https://api-v2.solscan.io/v2"
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
}

module.exports = {
    checkAPIV2
}