const { Resend } = require("resend");
const { RESEND_API_KEY, EMAIL_FROM } = require("./config");

const sendEmail = async (email, subject, text) => {
    try {
        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is missing");
        }

        if (!email) {
            throw new Error("Customer email is missing");
        }

        const resend = new Resend(RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [email],
            subject,
            text
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log("Email sent successfully:", data.id);

        return data;

    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};

module.exports = sendEmail;