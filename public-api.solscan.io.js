const axios = require("axios").default;
const {OK, ERROR} = require("./status");


const PREFIX = "[PUBLIC-API]";
const TOKEN = process.env.PUBLIC_API_TOKEN
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

const otherCheck = async (solscanEndpoint, timeThreshold) => {
    let errors = [];

    // endpoint: /chaininfo
    try {
        const {data} = await getData(
            `${solscanEndpoint}/chaininfo`
        );
        if (!data) {
            errors.push(`${PREFIX} Failed to get chain info. Response data ${JSON.stringify(data)}`);
        } else {
            console.log(`${PREFIX} Get chain info success.`);
        }
    } catch (err) {
        errors.push(`${PREFIX} Failed to get chain info: ${err.message}`);
    }

    if (errors.length > 0) {
        return {
            status: ERROR,
            errors: errors
        }
    }

    return {
        status: OK
    };
};

const PUBLIC_API_CHECK_LIST = {
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
