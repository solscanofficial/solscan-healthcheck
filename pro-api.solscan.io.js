const axios = require("axios").default;
const {formatDistance} = require("date-fns");
const {OK, ERROR} = require("./status");


const SAMPLE_ADDRESS = `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`;
const SAMPLE_TOKEN = `SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt`;
const SAMPLE_NFT = "DfM8FTGLU5YTZ7duyqJtb568yQL5w9XtBUtHSUX6zt6W";
const SAMPLE_NFT_WALLET = "3vzSskynfMnNAVZm2on7ouazxoJLMc1DMEW4ttseTBcs";
const SAMPLE_NFT_COLLECTION_ID = "229f30fb8b5f0a7ff7fea1acd51bd102be43fe02e8d1c24f36331b41dae0d167";

const PREFIX = "[PRO-API]";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE2NzIyOTgxNzg4MjEsImVtYWlsIjoiaGFkb0B0b21vY2hhaW4uY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiaWF0IjoxNjcyMjk4MTc4fQ.tuZ37k3W5ZdW6Rb3GlrFgvMKmDCCzKuXsWaNcj5Pzv4";
const RETRY = 3;

const request = async (url) => {
    const headers = {
        "token": TOKEN
    }
    return await axios.get(url, {headers: headers});
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

const nftCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // endpoint: /nft/token/info/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/token/info/${SAMPLE_NFT}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get info of nft token (${solscanEndpoint}/nft/token/info/${SAMPLE_NFT}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get info of nft token success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get info of nft token (${solscanEndpoint}/nft/token/info/${SAMPLE_NFT}). Error: ${err.message}`);
    }

    // endpoint: /nft/token/ownership/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/token/ownership/${SAMPLE_NFT}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get ownership of nft token (${solscanEndpoint}/nft/token/ownership/${SAMPLE_NFT}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get ownership of nft token success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get ownership of nft token (${solscanEndpoint}/nft/token/ownership/${SAMPLE_NFT}). Error: ${err.message}`);
    }

    // endpoint: /nft/wallet/list_nft/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/wallet/list_nft/${SAMPLE_NFT_WALLET}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get list nft of wallet (${solscanEndpoint}/nft/wallet/list_nft/${SAMPLE_NFT_WALLET}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get list nft of wallet success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get list nft of wallet (${solscanEndpoint}/nft/wallet/list_nft/${SAMPLE_NFT_WALLET}). Error: ${err.message}`);
    }

    // endpoint: /nft/wallet/activity/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/wallet/activity/${SAMPLE_NFT_WALLET}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get nft activities of wallet (${solscanEndpoint}/nft/wallet/activity/${SAMPLE_NFT_WALLET}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get nft activities of wallet success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get nft activities of wallet (${solscanEndpoint}/nft/wallet/activity/${SAMPLE_NFT_WALLET}). Error: ${err.message}`);
    }

    // endpoint: /nft/collection/list
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/collection/list?search=${SAMPLE_NFT_COLLECTION_ID}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get list nft collection (${solscanEndpoint}/nft/collection/list?search=${SAMPLE_NFT_COLLECTION_ID}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get list nft collection success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get list nft collection (${solscanEndpoint}/nft/collection/list?search=${SAMPLE_NFT_COLLECTION_ID}). Error: ${err.message}`);
    }

    // endpoint: /nft/collection/list_nft/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/collection/list_nft/${SAMPLE_NFT_COLLECTION_ID}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get list nft of collection (${solscanEndpoint}/nft/collection/list_nft/${SAMPLE_NFT_COLLECTION_ID}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get list nft of collection success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get list nft of collection (${solscanEndpoint}/nft/collection/list_nft/${SAMPLE_NFT_COLLECTION_ID}). Error: ${err.message}`);
    }

    // endpoint: /nft/collection/activity/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/collection/activity/${SAMPLE_NFT_COLLECTION_ID}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get list activities of nft collection (${solscanEndpoint}/nft/collection/activity/${SAMPLE_NFT_COLLECTION_ID}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get list activities of nft collection success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get list activities of nft collection (${solscanEndpoint}/nft/collection/activity/${SAMPLE_NFT_COLLECTION_ID}). Error: ${err.message}`);
    }

    // endpoint: /nft/collection/price/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/collection/price/${SAMPLE_NFT_COLLECTION_ID}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get price of nft collection (${solscanEndpoint}/nft/collection/price/${SAMPLE_NFT_COLLECTION_ID}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get price of nft collection success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get price of nft collection (${solscanEndpoint}/nft/collection/price/${SAMPLE_NFT_COLLECTION_ID}). Error: ${err.message}`);
    }

    // endpoint: /nft/collection/holders/{address}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/nft/collection/holders/${SAMPLE_NFT_COLLECTION_ID}`
        );
        if (!data || data.status !== 1) {
            errors.push(`${PREFIX} Failed to get holders of nft collection (${solscanEndpoint}/nft/collection/holders/${SAMPLE_NFT_COLLECTION_ID}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get price of nft collection success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get holders of nft collection (${solscanEndpoint}/nft/collection/holders/${SAMPLE_NFT_COLLECTION_ID}). Error: ${err.message}`);
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

const blockCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];
    let latestBlockNumber;

    // endpoint: /block/last
    let blockUrl = "";
    try {
        blockUrl = `${solscanEndpoint}/block/last?limit=5`;
        const {data} = await getData(blockUrl);
        if (!data || !data[0]) {
            errors.push(`${PREFIX} Failed to get last block (${blockUrl}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get latest block success`);

            let latestBlock = data[0];
            for (let block of data) {
                if (block.result.blockhash) {
                    latestBlock = block;
                    break;
                }
            }
            latestBlockNumber = latestBlock.currentSlot;
            let now = Date.now() / 1000;
            if (now - latestBlock.result.blockTime > timeThreshold) {
                errors.push(`${PREFIX} No new block since ${formatDistance(
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

        // endpoint: /block/transaction
        if (latestBlockNumber) {
            blockUrl = `${solscanEndpoint}/block/transactions?block=${latestBlockNumber}`;
            const {data} = await getData(blockUrl);
            if (!data) {
                errors.push(`${PREFIX} Failed to get block transaction (${blockUrl}). Response data ${JSON.stringify(data)}`);
            } else {
                console.log(`${PREFIX} Get transactions of block success`);
            }
        }

        // endpoint: /block/${block}
        if (latestBlockNumber) {
            blockUrl = `${solscanEndpoint}/block/${latestBlockNumber}`;
            const {data} = await getData(blockUrl);
            if (!data || !data.currentSlot || !data.result) {
                errors.push(`${PREFIX} Failed to get block detail (${blockUrl}). Response data ${JSON.stringify(data)}`);
            } else {
                console.log(`${PREFIX} Get block info success`);
            }
        }
    } catch (err) {
        errors.push(`${PREFIX} Block API is down (${blockUrl}). Error: ${err.message}`);
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
        // endpoint: /transaction/last
        txUrl = `${solscanEndpoint}/transaction/last?limit=10`;
        const {data} = await getData(txUrl);
        if (!data || !data[0]) {
            errors.push(`${PREFIX} Failed to get last transaction (${txUrl}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get last transaction success`);
        }

        // endpoint: /transaction/${signature}
        let latestTx = data[0];
        let latestSig;

        if (latestTx) {
            latestSig = latestTx.transaction.signatures[0];
        }

        if (latestSig) {
            txUrl = `${solscanEndpoint}/transaction/${latestSig}`;
            const {data: txDetail} = await getData(txUrl);
            if (!txDetail || txDetail.txHash !== latestSig) {
                errors.push(`${PREFIX} Failed to get transaction detail (${txUrl}). Response data ${JSON.stringify(txDetail)}`);
            } else {
                console.log(`${PREFIX} Get transaction detail success.`);
            }

            let now = Date.now() / 1000;
            if (now - txDetail.blockTime > timeThreshold) {
                errors.push(`${PREFIX} No new transaction since ${formatDistance(
                    txDetail.blockTime * 1000,
                    new Date(),
                    {
                        addSuffix: true,
                    }
                )} (${new Date(txDetail.blockTime * 1000).toLocaleTimeString(
                    "en-US"
                )})`);
            }
        }
    } catch (err) {
        errors.push(`${PREFIX} Transaction API is down (${txUrl}). Error: ${err.message}`);
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

    // endpoint: /account/tokens
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/tokens?account=${SAMPLE_ADDRESS}`
        );
        if (!data || !data[0] || !data[0].tokenAddress) {
            errors.push(`${PREFIX} Failed to get tokens of account (${solscanEndpoint}/account/tokens?account=${SAMPLE_ADDRESS}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get tokens of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get tokens of account (${solscanEndpoint}/account/tokens?account=${SAMPLE_ADDRESS}). Error: ${err.message}`)
    }

    // endpoint: /account/transactions
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/transactions?account=${SAMPLE_ADDRESS}&limit=1`
        );
        if (!data || !data[0] || !data[0].txHash) {
            errors.push(`${PREFIX} Failed to get transactions of account (${solscanEndpoint}/account/transactions?account=${SAMPLE_ADDRESS}&limit=1). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get transactions of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get transactions of account (${solscanEndpoint}/account/transactions?account=${SAMPLE_ADDRESS}&limit=1). Error: ${err.message}`);
    }

    // endpoint: /account/stakeAccounts
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/stakeAccounts?account=${SAMPLE_ADDRESS}`
        );
        if (!data) {
            errors.push(`${PREFIX} Failed to get stake accounts of account (${solscanEndpoint}/account/stakeAccounts?account=${SAMPLE_ADDRESS}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get stake accounts of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get stake accounts of account (${solscanEndpoint}/account/stakeAccounts?account=${SAMPLE_ADDRESS}). Error: ${err.message}`);
    }

    // endpoint: /account/solTransfers
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/solTransfers?account=${SAMPLE_ADDRESS}&limit=1`
        );
        if (!data || !data.data || !data.data[0] || !data.data[0].txHash) {
            errors.push(`${PREFIX} Failed to get SolTransfer of account (${solscanEndpoint}/account/solTransfers?account=${SAMPLE_ADDRESS}&limit=1). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get SolTransfer success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get SolTransfer of account (${solscanEndpoint}/account/solTransfers?account=${SAMPLE_ADDRESS}&limit=1). Error: ${err.message}`);
    }

    // endpoint: /account/splTransfers
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/splTransfers?account=${SAMPLE_ADDRESS}&limit=1`
        );
        if (!data || !data.data || !data.data[0] || !data.data[0].tokenAddress) {
            errors.push(`${PREFIX} Failed to get SplTransfer of account (${solscanEndpoint}/account/splTransfers?account=${SAMPLE_ADDRESS}&limit=1). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get SplTransfer success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get SplTransfer of account (${solscanEndpoint}/account/splTransfers?account=${SAMPLE_ADDRESS}&limit=1). Error: ${err.message}`);
    }

    // endpoint: /account/${account}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/${SAMPLE_ADDRESS}`
        );
        if (!data || !data.type || data.account !== SAMPLE_ADDRESS) {
            errors.push(`${PREFIX} Failed to get AccountData of account (${solscanEndpoint}/account/${SAMPLE_ADDRESS}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get info of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get AccountData of account (${solscanEndpoint}/account/${SAMPLE_ADDRESS}). Error: ${err.message}`);
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

    // endpoint: /token/list
    try {
        const {data} = await getData(
            `${solscanEndpoint}/token/list?offset=0&limit=5&sortBy=market_cap&direction=desc`
        );
        if (!data || !data.data || !data.data[0] || !data.data[0].mintAddress) {
            errors.push(`${PREFIX} Failed to get TokenList (${solscanEndpoint}/token/list?offset=0&limit=5&sortBy=market_cap&direction=desc). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get token list success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get TokenList (${solscanEndpoint}/token/list?offset=0&limit=5&sortBy=market_cap&direction=desc). Error: ${err.message}`);
    }

    // endpoint: /token/meta
    try {
        const {data} = await getData(
            `${solscanEndpoint}/token/meta?tokenAddress=${SAMPLE_TOKEN}`
        );
        if (!data || !data.symbol) {
            errors.push(`${PREFIX} Failed to get TokenMetadata (${solscanEndpoint}/token/meta?tokenAddress=${SAMPLE_TOKEN}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get token meta success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get TokenMetadata (${solscanEndpoint}/token/meta?tokenAddress=${SAMPLE_TOKEN}). Error: ${err.message}`);
    }

    // endpoint: /token/holders
    try {
        const {data} = await getData(
            `${solscanEndpoint}/token/holders?tokenAddress=${SAMPLE_TOKEN}&offset=0&size=5`
        );
        if (!data) {
            errors.push(`${PREFIX} Failed to get Token Holder (${solscanEndpoint}/token/holders?tokenAddress=${SAMPLE_TOKEN}&offset=0&size=5). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get token holders success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get Token Holder (${solscanEndpoint}/token/holders?tokenAddress=${SAMPLE_TOKEN}&offset=0&size=5). Error: ${err.message}`);
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

const otherCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // endpoint: /market/token/
    try {
        const {data} = await getData(
            `${solscanEndpoint}/market/token/${SAMPLE_TOKEN}`
        );
        if (!data) {
            errors.push(`${PREFIX} Failed to get market info of token (${solscanEndpoint}/market/token/${SAMPLE_TOKEN}). Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get market info of token success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get market info of token (${solscanEndpoint}/market/token/${SAMPLE_TOKEN}). Error: ${err.message}`);
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

const PRO_API_CHECK_LIST = {
    nft: {
        healthCheckFunction: nftCheck,
    },
    block: {
        healthCheckFunction: blockCheck,
        timeThreshold: 5 * 60,
    },
    transaction: {
        healthCheckFunction: transactionCheck,
        timeThreshold: 5 * 60,
    },
    account: {
        healthCheckFunction: accountCheck,
    },
    token: {
        healthCheckFunction: tokenCheck,
    },
    others: {
        healthCheckFunction: otherCheck,
    }
};

const getProApiHealthCheckData = async (
    solscanEndpoint = "https://pro-api.solscan.io/v1.0"
) => {
    let data = [];
    for (const module in PRO_API_CHECK_LIST) {
        let checker = Object.assign({}, PRO_API_CHECK_LIST[module]);
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
    getProApiHealthCheckData,
};
