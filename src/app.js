// import connection from "./src/configs/database";
const app = require("./index");
const PORT = process.env.PORT || 8087;
const HOST = process.env.HOST_NAME;

(async () => {
    try {
        // await connection();
        app.listen(PORT, HOST, () => {
            console.log(`Post service is listening on port ${PORT}`);
        })
    } catch (error) {
        console.log("BACKEND ERROR CONNECTING TO DBS: ", error);
    }
})();