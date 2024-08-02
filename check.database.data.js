const { createClient } = require('@clickhouse/client');
const { OK, ERROR } = require("./status");
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, './.env')
})

const PREFIX = '[Solscan Clickhouse Data]'

function millisToMinutesAndSeconds(millis) {
    return Math.floor(millis / 60)
}

function getCurrentPartKey() {
    let d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return parseInt([year, month].join(''));
}

const checkActivitiesData = async (timeThreshold) => {
    let errors = [];
    const config_clickhouse = [
        {
            name: 'fact_token_transfer_activities',
            query: `SELECT min(block_time_key) as data
                    FROM solscan.fact_token_transfer_activities
                    WHERE part_key = {part_key}`
        },
        {
            name: 'fact_defi_activities',
            query: `SELECT min(block_time_key) as data
                    FROM solscan.fact_defi_activities
                    WHERE part_key = {part_key}`,
        },
        {
            name: 'fact_account_transfer_activities',
            query: `SELECT min(block_time_key) as data
                    FROM solscan.fact_account_transfer_activities
                    WHERE part_key = {part_key}`,
        },
        {
            name: 'fact_nft_activities',
            query: `SELECT min(block_time_key) as data
                    FROM solscan.fact_nft_activities
                    WHERE part_key = {part_key}`,
        },
        {
            name: 'fact_account_balance_activities',
            query: `SELECT min(block_time_key) as data
                    FROM solscan.fact_account_balance_activities
                    WHERE part_key = {part_key}`,
        },
        {
            name: 'fact_token_price_d',
            query: `SELECT max(updated_time) as data
                    FROM solscan.fact_token_price_d
                    WHERE part_key = {part_key}`,
            timeThreshold: 0.5 * 60 * 60
        },
        {
            name: 'fact_block_summary_detail',
            query: `SELECT max(updated_time) as data
                    FROM solscan.fact_block_summary_detail
                    WHERE part_key = {part_key}`,
            timeThreshold: 0.5 * 60 * 60
        }
    ]

    let listNode = process.env.CLICKHOUSE_NODES;

    const today = new Date().getTime() / 1000

    const part_key = getCurrentPartKey()

    if (listNode) {
        listNode = listNode.split(",");

        for (let node of listNode) {
            const client = createClient({
                url: node,
                username: process.env.CLICKHOUSE_USER,
                password: process.env.CLICKHOUSE_PASSWD,
                request_timeout: 60000,
                max_open_connections: 10
            })

            for (let obj of config_clickhouse) {
                obj.query = obj.query.replace("{part_key}", part_key)

                let res = []

                try {
                    let data = await client.query({
                        query: obj.query,
                        format: 'JSONEachRow'
                    })
                    res = await data.json()
                } catch (error) {
                    errors.push(`${PREFIX}[${node}] Query to ${obj.name} table failed`);
                }

                if (res && res.length > 0) {
                    const data = res[0]['data']
                    const distance = today - new Date(Math.abs(data))
                    timeThreshold = obj.timeThreshold ? obj.timeThreshold : timeThreshold
                    if (distance > timeThreshold) {
                        errors.push(`${PREFIX}[${node}] No data in ${obj.name} table in ${millisToMinutesAndSeconds(distance)} minutes ago`);
                    } else {
                        console.log(`${PREFIX}[${node}] Data in table ${obj.name} up to date`);
                    }
                }
            }

            // close client
            await client.close();
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
        healthCheckFunction: checkActivitiesData,
        timeThreshold: 5 * 60
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
