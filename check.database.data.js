const {createClient} = require('@clickhouse/client');
const {OK, ERROR} = require("./status");
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, './.env')
})

const checkActivitiesData = async (timeThreshold) => {
    let errors = [];
    const config_clickhouse = [
        {

            name: 'fact_token_transfer_activities',
            query: `SELECT block_time_key FROM solscan.fact_token_transfer_activities
                WHERE block_id_key = (SELECT min(block_id_key) FROM solscan.fact_token_transfer_activities)
                GROUP BY block_time_key `,
        },
        {

            name: 'fact_defi_activities',
            query: `SELECT block_time_key FROM solscan.fact_defi_activities
                WHERE block_id_key = (SELECT min(block_id_key) FROM solscan.fact_defi_activities)
                GROUP BY block_time_key `,
        },
        {

            name: 'fact_account_transfer_activities',
            query: `SELECT block_time_key FROM solscan.fact_account_transfer_activities
                WHERE block_id_key = (SELECT min(block_id_key) FROM solscan.fact_account_transfer_activities)
                GROUP BY block_time_key `,
        },
        {

            name: 'fact_nft_activities',
            query: `SELECT block_time_key FROM solscan.fact_nft_activities
                WHERE block_id_key = (SELECT min(block_id_key) FROM solscan.fact_nft_activities)
                GROUP BY block_time_key `,
        },
        {

            name: 'fact_account_transfer_activities',
            query: `SELECT block_time_key FROM solscan.fact_account_transfer_activities
                WHERE block_id_key = (SELECT min(block_id_key) FROM solscan.fact_account_transfer_activities)
                GROUP BY block_time_key `,
        },
        {

            name: 'fact_account_balance_activities',
            query: `SELECT block_time_key FROM solscan.fact_account_balance_activities
                WHERE block_id_key = (SELECT min(block_id_key) FROM solscan.fact_account_balance_activities)
                GROUP BY block_time_key `,
        }
    ]

    let listNode = process.env.CLICKHOUSE_NODES;

    const today = new Date().getTime() / 1000

    if (listNode) {
        console.log(listNode);
        listNode = listNode.split(",");
        for (let obj of config_clickhouse) {
            for (let node of listNode) {
                const client = createClient({
                    url: node,
                    username: process.env.CLICKHOUSE_USER,
                    password: process.env.CLICKHOUSE_PASSWD,
                    request_timeout: 60000,
                    max_open_connections: 10
                })
                console.log(obj.query);
                let data = await client.query({
                    query: obj.query,
                    format: 'JSONEachRow'
                })
                const res = await data.json()
                if (res && res.length > 0) {
                    const block_time_key = res[0]['block_time_key']
                    if (today - new Date(Math.abs(block_time_key)) > timeThreshold) {
                        errors.push(`[Solscan Clickhouse Data] No data in ${obj.name} table in clickhouse ${node} in 1 hour ago`);
                    }
                }
            }
        }
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
    activitiesData: {
        healthCheckFunction: tokenCheck,
        timeThreshold: 1 * 60 * 60
    }
}

const checkClickhouseData = async () => {
    let data = [];
    for (const module in CHECK_LIST) {
        let checker = Object.assign({}, CHECK_LIST[module]);
        let res = await checker["healthCheckFunction"](
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
    checkClickhouseData
}