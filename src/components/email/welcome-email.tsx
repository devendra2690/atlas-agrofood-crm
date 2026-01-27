import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Button,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    name: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}` : "";

export const WelcomeEmail = ({
    name,
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Atlas Agro Food CRM!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Welcome, {name}!</Heading>
                    <Text style={paragraph}>
                        We're excited to have you on board. Atlas Agro Food CRM helps you streamline your sales, procurement, and finance operations.
                    </Text>
                    <Button style={button} href={`${baseUrl}/dashboard`}>
                        Go to Dashboard
                    </Button>
                    <Text style={footer}>
                        Atlas Agro Food CRM<br />
                        Automated System Message
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeEmail;

const main = {
    backgroundColor: "#ffffff",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    width: "560px",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "1.1",
    margin: "0 0 15px",
};

const paragraph = {
    fontSize: "16px",
    lineHeight: "1.4",
    color: "#484848",
    marginBottom: "20px",
};

const button = {
    backgroundColor: "#000000",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    width: "100%",
    padding: "12px",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
    lineHeight: "1.4",
    marginTop: "20px",
};
