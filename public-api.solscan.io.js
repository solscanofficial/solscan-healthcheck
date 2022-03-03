const axios = require("axios").default;
const { formatDistance } = require("date-fns");

// **********************
// PLEASE VERIFY PUBLIC_API_CHECK_LIST
// **********************

const { OK, ERROR } = require('./status')


const PUBLIC_API_CHECK_LIST = {

};

const getPublicApiHealthCheckData = async (solscanEndpoint = "https://public-api.solscan.io") => {
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