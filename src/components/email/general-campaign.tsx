
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
} from "@react-email/components";
import * as React from "react";

interface GeneralCampaignEmailProps {
    subject: string;
    content: string;
    senderName?: string;
}

export const GeneralCampaignEmail = ({
    subject,
    content,
    senderName = "Atlas Agro Food Team",
}: GeneralCampaignEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>{subject}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>{subject}</Heading>
                    <Hr style={hr} />
                    <Section>
                        <Text style={text}>{content}</Text>
                    </Section>
                    <Hr style={hr} />
                    <Text style={footer}>
                        Best regards,
                        <br />
                        {senderName}
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: "#ffffff",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    width: "560px",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "1.25",
    color: "#1a1a1a",
    marginBottom: "24px",
};

const text = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#3c4043",
    whiteSpace: "pre-wrap", // Preserves newlines
};

const hr = {
    borderColor: "#e6e6e6",
    margin: "20px 0",
};

const footer = {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#666666",
};

export default GeneralCampaignEmail;
