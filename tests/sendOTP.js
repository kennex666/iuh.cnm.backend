
// dotenv path: "../.env"
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
const { sendOtp } = require("../src/utils/twilio");

sendOtp({
    phoneNumber: "+84191919191", 
    msg: "\nXin chao, chao mung ban den voi iMessify. Vui long khong chia se voi bat ki ai\n"
}).then((otp) => {
    console.log("OTP sent successfully:", otp);
}).catch((error) => {
    console.error("Error sending OTP:", error);
});