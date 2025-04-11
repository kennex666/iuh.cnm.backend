const { Snowflake } = require("nodejs-snowflake");

const uid = new Snowflake({
    custom_epoch: 1672531200000, // Custom epoch in milliseconds (January 1, 2023)
    worker_id: 1,
    process_id: 1,
    instance_id: 1,
});

/**
 * Generate a unique ID using Snowflake algorithm
 * @returns {string} - A unique ID
 */
const generateIdSnowflake = () => {
    return uid.getUniqueID(); // A 64 bit id is returned
}

module.exports = {
    generateIdSnowflake
}