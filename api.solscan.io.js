const axios = require("axios").default;
const { formatDistance } = require("date-fns");

// **********************
// PLEASE VERIFY CHECK_LIST
// **********************

const { OK, ERROR } = require("./status");

const SAMPLE_ADDRESS = `2qzTURMGo9gVdwYyCbyiTrvyDCvLNDaRPkiWefdnmExb`;
const SAMPLE_TOKEN = `SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt`;

const blockCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(`${solscanEndpoint}/block/last?q=1`);
    if (!data || !data[0]) {
      return {
        status: ERROR,
        error: `Solscan Block API is down. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
    let latestBlock = data[0];
    let now = Date.now() / 1000;
    if (now - latestBlock.result.blockTime > timeThreshold) {
      return {
        status: ERROR,
        error: `No new block since ${formatDistance(
          latestBlock.result.blockTime * 1000,
          new Date(),
          {
            addSuffix: true,
          }
        )} (${new Date(latestBlock.result.blockTime * 1000).toLocaleTimeString(
          "en-US"
        )}). LatestBlock: ${latestBlock.result.blockHeight}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Solscan Block API is down ${err}`,
    };
  }

  return {
    status: OK,
  };
};

const transactionCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(`${solscanEndpoint}/transaction/last?q=20`);
    if (!data || !data[0]) {
      return {
        status: ERROR,
        error: `Solscan TransactionLast API is down. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
    let latestTx = data[19];
    let now = Date.now() / 1000;
    if (now - latestTx.blockTime > timeThreshold) {
      return {
        status: ERROR,
        error: `No new transaction since ${formatDistance(
          latestTx.blockTime * 1000,
          new Date(),
          {
            addSuffix: true,
          }
        )} (${new Date(latestTx.blockTime * 1000).toLocaleTimeString(
          "en-US"
        )}) `,
      };
    }

    // check transaction detail API
    const { data: txDetail } = await axios.get(
      `${solscanEndpoint}/transaction?tx=${latestTx.txHash}`
    );
    if (!txDetail || txDetail.txHash != latestTx.txHash) {
      return {
        status: ERROR,
        error: `Solscan TransactionDetail API is down. TxHash: ${latestTx.txHash} .TxDetail is ${JSON.stringify(
          txDetail
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Solscan Transaction API is down ${err}`,
    };
  }

  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account/transaction?address=${SAMPLE_ADDRESS}`
    );
    if (!data || !data.succcess) {
      return {
        status: ERROR,
        error: `Failed to get transactions of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Failed to get transactions of account ${SAMPLE_ADDRESS} ${err}`,
    };
  }

  return {
    status: OK,
  };
};

const splTransferCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account/token/txs?address=${SAMPLE_ADDRESS}`
    );
    if (!data || !data.data) {
      return {
        status: ERROR,
        error: `Failed to get SplTransfer of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Failed to get SplTransfer of account ${SAMPLE_ADDRESS} ${err}`,
    };
  }

  return {
    status: OK,
  };
};

const solTransferCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account/soltransfer/txs?address=${SAMPLE_ADDRESS}`
    );
    if (!data || !data.data) {
      return {
        status: ERROR,
        error: `Failed to get SolTransfer of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Failed to get SolTransfer of account ${SAMPLE_ADDRESS} ${err}`,
    };
  }

  return {
    status: OK,
  };
};

const accountCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/account?address=${SAMPLE_ADDRESS}`
    );
    if (!data || !data.data || !data.data.type) {
      return {
        status: ERROR,
        error: `Failed to get AccountData of account ${SAMPLE_ADDRESS}. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Failed to get AccountData of account ${SAMPLE_ADDRESS} ${err}`,
    };
  }

  return {
    status: OK,
  };
};

const tokenCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/tokens?offset=0&limit=5&sortby=market_cap&sorttype=desc`
    );
    if (
      !data ||
      !data.data ||
      !data.data.tokens ||
      !data.data.tokens[0] ||
      !data.data.tokens[0].mintAddress
    ) {
      return {
        status: ERROR,
        error: `Failed to get TokenList. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Failed to get TokenList ${err}`,
    };
  }

  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/token/meta?token=${SAMPLE_TOKEN}`
    );
    if (!data || !data.data || !data.data.symbol) {
      return {
        status: ERROR,
        error: `Failed to get TokenMetadata of ${SAMPLE_TOKEN}. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Failed to get TokenMetadata of ${SAMPLE_TOKEN} ${err}`,
    };
  }
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/token/holders?token=${SAMPLE_TOKEN}&offset=0&size=5`
    );
    if (
      !data ||
      !data.data ||
      !data.data.total ||
      !data.data.result ||
      !data.data.result[0] ||
      !data.data.result[0].address
    ) {
      return {
        status: ERROR,
        error: `Failed to get Token Holder of ${SAMPLE_TOKEN}. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `Failed to get Token Holder of ${SAMPLE_TOKEN} ${err}`,
    };
  }

  return {
    status: OK,
  };
};

const defiCheck = async (solscanEndpoint, timeThreshold) => {
  try {
    const { data } = await axios.get(`${solscanEndpoint}/amm/all`);
    if (!data || !data.data || !data.data[0] || !data.data[0].address) {
      return {
        status: ERROR,
        error: `SolscanAPI: failed to get all AMMs. Response data ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `SolscanAPI: failed to get all AMMs ${err}`,
    };
  }
  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/amm/reads?source=raydium&keyword=sol&offset=0&limit=1`
    );
    if (
      !data ||
      !data.data ||
      !data.data.items ||
      !data.data.items[0] ||
      !data.data.items[0].address
    ) {
      return {
        status: ERROR,
        error: `SolscanAPI: failed to get AMM detail. Response data ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `SolscanAPI: failed to get AMM detail ${err}`,
    };
  }

  return {
    status: OK,
  };
};

const nftCheck = async (solscanEndpoint, timeThreshold) => {
  let latestTrade;
  let newNFT;

  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/nft/market/trade?offset=0&limit=1`
    );
    if (!data || !data.data || !data.data[0] || !data.data[0].tradeTime) {
      return {
        status: ERROR,
        error: `SolscanAPI: failed to get NFT trades. Response data ${JSON.stringify(
          data
        )}`,
      };
    }
    latestTrade = data.data[0];
  } catch (err) {
    return {
      status: ERROR,
      error: `SolscanAPI: failed to get NFT trades ${err}`,
    };
  }
  let now = Date.now() / 1000;
  if (now - latestTrade.tradeTime > timeThreshold) {
    return {
      status: ERROR,
      error: `No NFT trades since ${formatDistance(
        latestTrade.tradeTime * 1000,
        new Date(),
        {
          addSuffix: true,
        }
      )} (${new Date(latestTrade.tradeTime * 1000).toLocaleTimeString(
        "en-US"
      )}) `,
    };
  }

  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/collection?sortBy=volume`
    );
	if (
      !data ||
      !data.data ||
      !data.data[0]
    ) {
      return {
        status: ERROR,
        error: `SolscanAPI: failed to get NFT Collections ${JSON.stringify(
          data
        )}`,
      };
    }

  } catch (err) {
    return {
      status: ERROR,
      error: `SolscanAPI: failed to get NFT collection ${err}`,
    };
  }

  try {
    const { data } = await axios.get(
      `${solscanEndpoint}/nft?sortBy=createdTime`
    );
    if (
      !data ||
      !data.data ||
      !data.data[0] ||
      !data.data[0].info ||
      !data.data[0].info.createdTime
    ) {
      return {
        status: ERROR,
        error: `SolscanAPI: failed to get new NFTs. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
    newNFT = data.data[0].info;
  } catch (err) {
    return {
      status: ERROR,
      error: `SolscanAPI: failed to get new NFTs ${err}`,
    };
  }
  if (now - newNFT.createdTime > timeThreshold) {
    return {
      status: ERROR,
      error: `No new NFTs since ${formatDistance(
        newNFT.createdTime * 1000,
        new Date(),
        {
          addSuffix: true,
        }
      )} (${new Date(newNFT.createdTime * 1000).toLocaleTimeString("en-US")}) `,
    };
  }
   try {
    const { data } = await axios.get(
      `${solscanEndpoint}/nft?sortBy=tradeTime`
    );
    if (
      !data ||
      !data.data ||
      !data.data[0]
    ) {
      return {
        status: ERROR,
        error: `SolscanAPI: failed to get all NFTs. Response data is ${JSON.stringify(
          data
        )}`,
      };
    }
  } catch (err) {
    return {
      status: ERROR,
      error: `SolscanAPI: failed to get all NFTs ${err}`,
    };
  }

  return {
    status: OK,
  };
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
