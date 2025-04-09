// import connection from "./src/configs/database";
const app = require("./configs/app");
const connection = require("./database/connection");
const app = require("./index");
const PORT = process.env.PORT || 8087;
const HOST = process.env.HOST_NAME;

(async () => {
    try {
        await connection();
        console.log("MongoDB Connected...");
        app.listen(PORT, HOST, () => {
            console.log(`Server is listening on port ${PORT}`);
        })
    } catch (error) {
        console.log("BACKEND ERROR CONNECTING TO DBS: ", error);
    }
})();