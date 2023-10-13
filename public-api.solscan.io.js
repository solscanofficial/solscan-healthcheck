const axios = require("axios").default;
const {OK, ERROR} = require("./status");


const PREFIX = "[PUBLIC-API]";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE2NzIyOTgxNzg4MjEsImVtYWlsIjoiaGFkb0B0b21vY2hhaW4uY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiaWF0IjoxNjcyMjk4MTc4fQ.tuZ37k3W5ZdW6Rb3GlrFgvMKmDCCzKuXsWaNcj5Pzv4";

const getData = async (url) => {
    const headers = {
        "token": TOKEN
    }
    return await axios.get(url, {headers: headers});
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
