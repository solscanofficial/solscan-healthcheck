const axios = require("axios").default;
const {formatDistance} = require("date-fns");

// **********************
// PLEASE VERIFY PUBLIC_API_CHECK_LIST
// **********************

const {OK, ERROR} = require("./status");

const SAMPLE_ADDRESS = `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`;
const SAMPLE_TOKEN = `SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt`;

const PREFIX = "[PUBLIC-API]";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE2Nzk1NDY4ODE5NjYsImVtYWlsIjoibm9sZWRheDUyNkBldG9uZHkuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiaWF0IjoxNjc5NTQ2ODgxfQ.ucOqq71DuvWB2L90TYaJVOrnZaqie8uT9boVYhG7CGk";

const getData = async (url) => {
    const headers = {
        "Content-Type": "application/json",
        "token": TOKEN
    }
    return await axios.get(url, {headers: headers});
}

const blockCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];
    let latestBlockNumber;

    // endpoint: /block/last
    try {
        const {data} = await getData(`${solscanEndpoint}/block/last?limit=1`);
        if (!data || !data[0]) {
            errors.push(`${PREFIX} Latest Block API is down. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get latest block success`);

            let latestBlock = data[0];
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
            const {data} = await getData(
                `${solscanEndpoint}/block/transactions?block=${latestBlockNumber}`
            );
            if (!data) {
                errors.push(`${PREFIX} BlockTransaction API is down. Response data ${JSON.stringify(data)}`);
            } else {
                console.log(`${PREFIX} Get transactions of block success`);
            }
        }

        // endpoint: /block/${block}
        if (latestBlockNumber) {
            const {data} = await getData(
                `${solscanEndpoint}/block/${latestBlockNumber}`
            );
            if (!data || !data.currentSlot || !data.result) {
                errors.push(`${PREFIX} BlockDetail API is down. Response data ${JSON.stringify(data)}`);
            } else {
                console.log(`${PREFIX} Get block info success`);
            }
        }
    } catch (err) {
        errors.push(`${PREFIX} Block API is down: ${err}`);
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
        // endpoint: /transaction/last
        const {data} = await getData(
            `${solscanEndpoint}/transaction/last?limit=1`
        );
        if (!data || !data[0]) {
            errors.push(`${PREFIX} TransactionLast API is down. Response data ${JSON.stringify(data)}`);
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
            const {data: txDetail} = await getData(
                `${solscanEndpoint}/transaction/${latestSig}`
            );
            if (!txDetail || txDetail.txHash !== latestSig) {
                errors.push(`${PREFIX} TransactionDetail API is down. Response data ${JSON.stringify(txDetail)}`);
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
        errors.push(`${PREFIX} Transaction API is down: ${err}`);
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

    // endpoint: /account/splTransfers
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/splTransfers?account=${SAMPLE_ADDRESS}&limit=1`
        );
        if (!data || !data.data || !data.data[0] || !data.data[0].tokenAddress) {
            errors.push(`${PREFIX} Failed to get SplTransfer of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get SplTransfer success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get SplTransfer of account ${SAMPLE_ADDRESS}: ${err}`);
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

    // endpoint: /account/solTransfers
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/solTransfers?account=${SAMPLE_ADDRESS}&limit=1`
        );
        if (!data || !data.data || !data.data[0] || !data.data[0].txHash) {
            errors.push(`${PREFIX} Failed to get SolTransfer of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get SolTransfer success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get SolTransfer of account ${SAMPLE_ADDRESS}: ${err}`);
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
            errors.push(`${PREFIX} Failed to get tokens of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get tokens of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get tokens of account ${SAMPLE_ADDRESS}: ${err}`)
    }

    // endpoint: /account/transactions
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/transactions?account=${SAMPLE_ADDRESS}&limit=1`
        );
        if (!data || !data[0] || !data[0].txHash) {
            errors.push(`${PREFIX} Failed to get transactions of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get transactions of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get transactions of account ${SAMPLE_ADDRESS}: ${err}`);
    }

    // endpoint: /account/stakeAccounts
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/stakeAccounts?account=${SAMPLE_ADDRESS}`
        );
        if (!data) {
            errors.push(`${PREFIX} Failed to get stake accounts of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get stake accounts of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get stake accounts of account ${SAMPLE_ADDRESS}: ${err}`);
    }

    // endpoint: /account/${account}
    try {
        const {data} = await getData(
            `${solscanEndpoint}/account/${SAMPLE_ADDRESS}`
        );
        if (!data || !data.type || data.account !== SAMPLE_ADDRESS) {
            errors.push(`${PREFIX} Failed to get AccountData of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get info of account success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get AccountData of account ${SAMPLE_ADDRESS}: ${err}`);
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
            errors.push(`${PREFIX} Failed to get TokenList. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get token list success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get TokenList: ${err}`);
    }

    // endpoint: /token/meta
    try {
        const {data} = await getData(
            `${solscanEndpoint}/token/meta?tokenAddress=${SAMPLE_TOKEN}`
        );
        if (!data || !data.symbol) {
            errors.push(`${PREFIX} Failed to get TokenMetadata of ${SAMPLE_TOKEN}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get token meta success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get TokenMetadata of ${SAMPLE_TOKEN}: ${err}`);
    }

    // endpoint: /token/holders
    try {
        const {data} = await getData(
            `${solscanEndpoint}/token/holders?tokenAddress=${SAMPLE_TOKEN}&offset=0&size=5`
        );
        if (!data) {
            errors.push(`${PREFIX} Failed to get Token Holder of ${SAMPLE_TOKEN}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get token holders success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get Token Holder of ${SAMPLE_TOKEN}: ${err}`);
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
            errors.push(`${PREFIX} Failed to get market info of token ${SAMPLE_TOKEN}. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get market info of token success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get market info of token ${SAMPLE_TOKEN}: ${err}`);
    }

    // endpoint: /chaininfo/
    try {
        const {data} = await getData(
            `${solscanEndpoint}/chaininfo/`
        );
        if (!data) {
            errors.push(`${PREFIX} Failed to get chain info. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get chain info success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get chain info: ${err}`);
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

const PUBLIC_API_CHECK_LIST = {
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
    others: {
        healthCheckFunction: otherCheck,
    },
};

const getPublicApiHealthCheckData = async (
    solscanEndpoint = "https://public-api.solscan.io"
) => {
    let data = [];
    for (const module in PUBLIC_API_CHECK_LIST) {
        let checker = Object.assign({}, PUBLIC_API_CHECK_LIST[module]);
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
    getPublicApiHealthCheckData,
};
