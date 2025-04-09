// import connection from "./src/configs/database";
const app = require("./configs/app");
const connection = require("./database/connection");
const router = require("./routes");
const PORT = process.env.PORT || 8087;
const HOST = process.env.HOST_NAME;

(async () => {
    try {
        await connection();
        console.log("MongoDB Connected...");

        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
        app.use("/api", router);
        app.listen(PORT, HOST, () => {
            console.log(`Server is listening on port ${PORT}`);
        })
    } catch (error) {
        console.log("BACKEND ERROR CONNECTING TO DBS: ", error);
    }
})();