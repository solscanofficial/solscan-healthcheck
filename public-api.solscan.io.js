const axios = require("axios").default
const { formatDistance } = require("date-fns")

// **********************
// PLEASE VERIFY PUBLIC_API_CHECK_LIST
// **********************

const { OK, ERROR } = require('./status')


const SAMPLE_ADDRESS = `2qzTURMGo9gVdwYyCbyiTrvyDCvLNDaRPkiWefdnmExb`
const SAMPLE_TOKEN = `SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt`

const PREFIX = '[PUBLIC-API]'

const blockCheck = async (solscanEndpoint, timeThreshold) => {
  let latestBlockNumber

  // endpoint: /block/last
  try {
    const { data } = await axios.get(`${solscanEndpoint}/block/last?limit=1`)
    if (!data || !data[0]) {
      return {
        status: ERROR,
        error: `${PREFIX} Latest Block API is down. Response data ${JSON.stringify(data)}`,
      }
    }
    let latestBlock = data[0]
    latestBlockNumber = latestBlock.result.blockHeight
    let now = Date.now() / 1000
    if (now - latestBlock.result.blockTime > timeThreshold) {
      return {
        status: ERROR,
        error: `${PREFIX} No new block since ${formatDistance(
          latestBlock.result.blockTime * 1000,
          new Date(),
          {
            addSuffix: true,
          }
        )} (${new Date(latestBlock.result.blockTime * 1000).toLocaleTimeString(
          "en-US"
        )}). LatestBlock: ${latestBlock.result.blockHeight}`,
      }
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Latest Block API is down ${err}`,
    }
  }

// endpoint: /block/transaction
  if (latestBlockNumber) {
    const { data } = await axios.get(`${solscanEndpoint}/block/transactions?block=${latestBlockNumber}`)
  }

  // endpoint: /block/${block}
  if (latestBlockNumber) {
    const { data } = await axios.get(`${solscanEndpoint}/block/${latestBlockNumber}`)
    if (!data || !data.currentSlot || !data.result) {
      return {
        status: ERROR,
        error: `${PREFIX} BlockDetail API is down. Response data ${JSON.stringify(data)}`,
      }
    }
  }

  return {
    status: OK,
  }
}


const transactionCheck = async (solscanEndpoint, timeThreshold) => {
  try {

    // endpoint: /transaction/last

    const { data } = await axios.get(
      `${solscanEndpoint}/transaction/last?limit=1`
    )
//   if (!data || !data[0]) {
//     return {
//       status: ERROR,
//       error: `${PREFIX} TransactionLast API is down. Response data ${JSON.stringify(data)}`,
//     }
//   }
    let latestTx = data[0]
    let now = Date.now() / 1000
    if (now - latestTx.blockTime > timeThreshold) {
      return {
        status: ERROR,
        error: `${PREFIX} No new transaction since ${formatDistance(
          latestTx.blockTime * 1000,
          new Date(),
          {
            addSuffix: true,
          }
        )} (${new Date(latestTx.blockTime * 1000).toLocaleTimeString(
          "en-US"
        )}) `,
      }
    }

    // endpoint: /transaction/${signature}

    // check transaction detail API
    const { data : txDetail } = await axios.get(
      `${solscanEndpoint}/transaction/${latestTx.transaction.signatures[0]}`
    )
    if (!txDetail || txDetail.txHash != latestTx.transaction.signatures[0]) {
      return {
        status: ERROR,
        error: `${PREFIX} TransactionDetail API is down. Response data ${JSON.stringify(txDetail)}`,
      }      
    }

    
  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Transaction API is down ${err}`,
    }
  }

  // endpoint: /account/transactions
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account/transactions?account=${SAMPLE_ADDRESS}&limit=1`
    )
    if (!data || !data[0] || !data[0].txHash) {
      return {
        status: ERROR,
        error: `${PREFIX} Failed to get transactions of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`,
      }
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Failed to get transactions of account ${SAMPLE_ADDRESS} ${err}`,
    }
  }

  return {
    status: OK,
  }
}


// endpoint: /account/splTransfers
const splTransferCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account/splTransfers?account=${SAMPLE_ADDRESS}&limit=1`
    )
    if (!data || !data.data || !data.data[0] || !data.data[0].tokenAddress) {
      return {
        status: ERROR,
        error: `${PREFIX} Failed to get SplTransfer of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`,
      }
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Failed to get SplTransfer of account ${SAMPLE_ADDRESS} ${err}`,
    }
  }

  return {
    status: OK,
  }
}

// endpoint: /account/solTransfers
const solTransferCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account/solTransfers?account=${SAMPLE_ADDRESS}&limit=1`
    )
    if (!data || !data.data || !data.data[0] || !data.data[0].txHash) {
      return {
        status: ERROR,
        error: `${PREFIX} Failed to get SolTransfer of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`,
      }
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Failed to get SolTransfer of account ${SAMPLE_ADDRESS} ${err}`,
    }
  }

  return {
    status: OK,
  }
}


// endpoint: /account/${account}
const accountCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account/${SAMPLE_ADDRESS}`
    )
    if (!data || !data.type || data.account != SAMPLE_ADDRESS) {
      return {
        status: ERROR,
        error: `${PREFIX} Failed to get AccountData of account ${SAMPLE_ADDRESS}. Response data ${JSON.stringify(data)}`,
      }
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Failed to get AccountData of account ${SAMPLE_ADDRESS} ${err}`,
    }
  }

  return {
    status: OK,
  }
}


const tokenCheck = async (solscanEndpoint, timeThreshold) => {

  // endpoint: /token/list
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/token/list?offset=0&limit=5&sortBy=market_cap&direction=desc`
    )
    if (!data || !data.data || !data.data[0] || !data.data[0].mintAddress) {
      return {
        status: ERROR,
        error: `${PREFIX} Failed to get TokenList. Response data ${JSON.stringify(data)}`,
      }
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Failed to get TokenList ${err}`,
    }
  }

  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/token/meta?tokenAddress=${SAMPLE_TOKEN}`
    )
    if (!data  || !data.symbol) {
      return {
        status: ERROR,
        error: `${PREFIX} Failed to get TokenMetadata of ${SAMPLE_TOKEN}. Response data ${JSON.stringify(data)}`,
      }
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Failed to get TokenMetadata of ${SAMPLE_TOKEN} ${err}`,
    }
  }
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/token/holders?tokenAddress=${SAMPLE_TOKEN}&offset=0&size=5`
    )
    if (!data  || !data.total || !data.data[0] || !data.data[0].address) {
      return {
        status: ERROR,
        error: `${PREFIX} Failed to get Token Holder of ${SAMPLE_TOKEN}. Response data ${JSON.stringify(data)}`,
      }
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `${PREFIX} Failed to get Token Holder of ${SAMPLE_TOKEN} ${err}`,
    }
  }

  return {
    status: OK,
  }
}




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
    healthCheckFunction: accountCheck
  },
  token: {
    healthCheckFunction: tokenCheck
  },
}

const getPublicApiHealthCheckData = async (solscanEndpoint = "https://public-api.solscan.io") => {
  let data = []
  for (const module in PUBLIC_API_CHECK_LIST) {
    let checker = Object.assign({}, PUBLIC_API_CHECK_LIST[module])
    let res = await checker["healthCheckFunction"](
      solscanEndpoint,
      checker["timeThreshold"]
    )
    data.push({
      module: module,
      ...res,
    })
  }
  return data
}

module.exports = {
  getPublicApiHealthCheckData,
}
