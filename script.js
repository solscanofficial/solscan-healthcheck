const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, './.env')
})

const noti_bot = require('noti_bot')
const notifyTelegram = noti_bot.telegram
const notifySlack = noti_bot.slack

const { 
    getHealthCheckData, 
    OK,
    ERROR
 } = require('./index.js')

const main = async () => {
    let data = await getHealthCheckData(process.env.SOLSCAN_ENDPOINT)
    if (!data || !data.length) {
        return
    }
    let errors = []
    for (const e of data) {
        if (e.status === ERROR) {
            errors.push(e.error)
        }
    }
    if (errors.length > 0) {
        let msg = process.env.PREFIX_MESSAGE + "\n" + errors.join("\n")
        notifySlack(msg, process.env.SLACK_HOOK_KEY, process.env.SLACK_CHANNEL, process.env.SLACK_BOTNAME, process.env.SLACK_BOT_ICON)
        notifyTelegram(msg, process.env.TELEGRAM_TOKEN, process.env.TELEGRAM_CHAT, true)
    }
}
main()