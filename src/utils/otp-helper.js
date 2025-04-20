const UserService = require("../services/user-service");
const { sendOtp } = require("../utils/twilio");

async function resendOtpHelper(phone, msg){
    const user = await UserService.getUserByPhone(phone);
    if (!user) {
        return responseFormat(res, null, "User not found", false, 404);
    }

    const dateRecentlySend = new Date(user.otp.expiredAt);
    // revert 5 mins to get time create
    dateRecentlySend.setMinutes(dateRecentlySend.getMinutes() - 5);
    const currentDate = new Date();
    // check if otp create in 1 mins

    currentDate.setMinutes(currentDate.getMinutes() - 1);

    if (dateRecentlySend > currentDate) {
        return {
            errorCode: 407,
            message: "Wait for 1 minute to resent otp",
        }
    }

    msg += "\nTUYET DOI KHONG CHIA SE MA VOI BAT KI AI\n";
    // replace phonenumber with +84
    const phoneNumber = user.phone.replace(/^(0)/, "+84");
    const result = await UserService.createOTP(user.id);
    if (!result) {
        return {
            errorCode: 500,
            message: "Failed to create OTP",
        }
    }
    const otp = result.otp.code;
    await sendOtp({ phoneNumber, msg, otp });
    return {
        errorCode: 200,
        message: "OTP resent successfully",
    }
}

module.exports = {
    resendOtpHelper,
};