import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Button,
    Img,
} from "@react-email/components";
import * as React from "react";

interface ClientWelcomeEmailProps {
    clientName: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}` : "";

export const ClientWelcomeEmail = ({
    clientName,
}: ClientWelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to the Atlas Agro Food network</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Welcome, {clientName}!</Heading>
                    <Text style={paragraph}>
                        Thank you for joining the Atlas Agro Food network. We are delighted to have you as a partner.
                    </Text>
                    <Text style={paragraph}>
                        Our team is dedicated to providing you with the best quality products and service. We look forward to a successful collaboration.
                    </Text>

                    <Text style={paragraph}>
                        If you have any immediate requirements or questions, please do not hesitate to reach out to our sales team.
                    </Text>

                    <Text style={footer}>
                        Atlas Agro Food<br />
                        Global Sourcing & Supply
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default ClientWelcomeEmail;

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
    color: "#111",
};

const paragraph = {
    fontSize: "16px",
    lineHeight: "1.4",
    color: "#484848",
    marginBottom: "20px",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
    lineHeight: "1.4",
    marginTop: "20px",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
};
