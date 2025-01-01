export const sendPushNotification = async (title :string, body = "string", data :any) => {
    // Kiểm tra nếu expoPushToken không hợp lệ

    // Tạo nội dung thông báo
    const message = {
        to: process.env.TEST_NOTIFICATION_TOKEN,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        // Gửi thông báo đẩy tới API của Expo
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        // Chuyển đổi phản hồi từ Expo Push API sang JSON
        const responseData = await response.json();

        // Kiểm tra nếu phản hồi không thành công từ Expo Push API
        if (responseData.errors) {
            throw new Error(`Error sending push notification: ${JSON.stringify(responseData.errors)}`);
        }

        // Trả về kết quả nếu thông báo được gửi thành công
        return responseData;
    } catch (error) {
        // Xử lý lỗi và trả về thông báo lỗi
        console.error('Error sending push notification', error);
        throw new Error('Failed to send push notification');
    }
};