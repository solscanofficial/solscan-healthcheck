const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, './.env')
})
const noti_bot = require('noti_bot')
const notifyTelegram = noti_bot.telegram
const notifySlack = noti_bot.slack
const {createClient} = require('@clickhouse/client');
const {
    checkAPI,
    getPublicApiHealthCheckData,
    OK,
    ERROR
} = require('./index.js')
const {getProApiHealthCheckData} = require("./pro-api.solscan.io");
const axios = require("axios");
const {checkAPIV2} = require("./api-v2.solscan.io");


const checkNode = async (node) => {
    let errors = [];
    try {
        const getHealth = {"jsonrpc": "2.0", "id": 1, "method": "getHealth"}
        const {data: res} = await axios.post(node, getHealth);
        if (!res || res.error) {
            errors.push(`[Solana node] Node (${node}) is unhealthy, error: ${JSON.stringify(res.error)}`);
        } else {
            console.log(`[Solana node] Node (${node}) is healthy`);
        }
    } catch (err) {
        errors.push(`[Solana node] Node (${node}) is unhealthy, error: ${err}`);
    }

    return errors;
}

const checkClickhouse = async (node) => {
    let errors = [];
    try {
        const client = createClient({
            url: node,
            username: process.env.CLICKHOUSE_USER,
            password: process.env.CLICKHOUSE_PASSWD,
            request_timeout: 60000,
            max_open_connections: 10
        })

        const result = await client.ping();
        if (!result.success) {
            errors.push(`[Clickhouse node] Node ${node} is unhealthy. Result: ${JSON.stringify(result)}`);
        }
        await client.close()
        console.log("Ping node", node, result);
    } catch (err) {
        errors.push(`[Clickhouse node] Node ${node} is unhealthy. Error: ${err}`);
    }

    return errors;
}

const main = async () => {
    let errors = []

    let start = Date.now();

    // check disk if rabbitmq
    if (process.env.IS_CHECK_RABBITMQ_DISK === "true") {
        try {
            const {data} = await axios.get(process.env.CHECK_RABBITMQ_DISK_API);
            if (data) {
                let path = data.diskPath;
                let total = data.size;
                let used = data.size - data.free;

                if (path === "/data") {
                    let usedPercent = used / total * 100;
                    if (usedPercent > 5) {
                        errors.push(`[RabbitMQ] Used disk is increasing, maybe something has problem. Path=${path}, used: ${Math.round(used / (1024 * 1024 * 1024))}GB, used percent: ${Math.round(usedPercent * 100) / 100}%`)
                    }
                }
            }
        } catch (err) {
            console.error("Error when checking rabbitmq disk:", err);
        }
    }

    // check health
    if (process.env.IS_CHECK_NODE === 'true') {
        let listNode = process.env.NODE_RPC_ENDPOINT;
        if (listNode) {
            listNode = listNode.split(",");
            for (let node of listNode) {
                let err = await checkNode(node);
                if (err.length > 0) {
                    errors.push(...err);
                }
            }
        }
    }

    if (process.env.IS_CHECK_CLICKHOUSE === "true") {
        let listNode = process.env.CLICKHOUSE_NODES;
        if (listNode) {
            listNode = listNode.split(",");
            for (let node of listNode) {
                let err = await checkClickhouse(node);
                if (err.length > 0) {
                    errors.push(...err);
                }
            }
        }
    }

    // API v2
    if (process.env.IS_CHECK_SOLSCAN_API_V2 === "true") {
        let dataV2 = await checkAPIV2(process.env.SOLSCAN_ENDPOINT_V2)
        if (dataV2 && dataV2.length) {
            for (const e of dataV2) {
                if (e.status === ERROR) {
                    errors.push(...e.errors)
                }
            }
        }
    }

    // API
    let data = await checkAPI(process.env.SOLSCAN_ENDPOINT)
    if (data && data.length) {
        for (const e of data) {
            if (e.status === ERROR) {
                errors.push(...e.errors)
            }
        }
    }

    // PUBLIC API
    if (process.env.IS_CHECK_PUBLIC_API === 'true') {
        let publicApiData = await getPublicApiHealthCheckData(process.env.PUBLIC_API_ENDPOINT)
        if (publicApiData && publicApiData.length) {
            for (const e of publicApiData) {
                if (e.status === ERROR) {
                    errors.push(...e.errors)
                }
            }
        }
    }

    // PRO API
    if (process.env.IS_CHECK_PRO_API === 'true') {
        let proApiData = await getProApiHealthCheckData(process.env.PRO_API_ENDPOINT)
        if (proApiData && proApiData.length) {
            for (const e of proApiData) {
                if (e.status === ERROR) {
                    errors.push(...e.errors)
                }
            }
        }
    }

    let region = process.env.REGION;
    if (region) {
        errors.forEach((element, index) => {
            errors[index] = `[${region}] ${element}`;
        });
    }

    // sending notifications
    if (errors.length > 0) {
        let msgSlack = process.env.PREFIX_MESSAGE + "\n" + errors.join("\n")
        // let msgTele = process.env.PREFIX_MESSAGE + "\n" + errors.join("\n\n")
        notifySlack(msgSlack, process.env.SLACK_HOOK_KEY, process.env.SLACK_CHANNEL, process.env.SLACK_BOTNAME, process.env.SLACK_BOT_ICON)
        for (let error of errors) {
            notifyTelegram(error, process.env.TELEGRAM_TOKEN, process.env.TELEGRAM_CHAT, true)
        }

    }

    // console.log --- just for local testing
    // if (errors.length > 0) {
    //     let msg = errors.join("\n");
    //     console.log(msg);
    // }

    let end = Date.now();
    console.log(`Finish, check process took ${end - start} ms`);
}

main();