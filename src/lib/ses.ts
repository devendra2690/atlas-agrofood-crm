
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

export const checkSesConfig = () => {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        return false;
    }
    return true;
};

export async function sendSesEmail({
    to,
    from,
    subject,
    html,
    replyTo
}: {
    to: string;
    from: string;
    subject: string;
    html: string;
    replyTo?: string;
}) {
    const command = new SendEmailCommand({
        Source: from,
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: "UTF-8",
            },
            Body: {
                Html: {
                    Data: html,
                    Charset: "UTF-8",
                },
            },
        },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
    });

    return ses.send(command);
}
