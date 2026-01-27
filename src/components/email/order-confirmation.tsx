import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmationEmailProps {
    orderId: string;
    customerName: string;
    items: {
        product: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    orderDate: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}` : "";

export const OrderConfirmationEmail = ({
    orderId,
    customerName,
    items,
    totalAmount,
    orderDate,
}: OrderConfirmationEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Your Atlas Agro order #{orderId} has been confirmed!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Order Confirmation</Heading>
                    <Text style={paragraph}>Hi {customerName},</Text>
                    <Text style={paragraph}>
                        Thank you for your order. We have received your request and are processing it now.
                    </Text>
                    <Section style={orderInfo}>
                        <Row>
                            <Column>
                                <Text style={label}>Order ID</Text>
                                <Text style={value}>#{orderId}</Text>
                            </Column>
                            <Column>
                                <Text style={label}>Date</Text>
                                <Text style={value}>{orderDate}</Text>
                            </Column>
                        </Row>
                    </Section>
                    <Hr style={hr} />
                    <Section>
                        {items?.map((item, index) => (
                            <Row key={index} style={{ marginBottom: "10px" }}>
                                <Column>
                                    <Text style={itemText}>
                                        {item.product} (x{item.quantity})
                                    </Text>
                                </Column>
                                <Column align="right">
                                    <Text style={itemText}>₹{item.price * item.quantity}</Text>
                                </Column>
                            </Row>
                        ))}
                    </Section>
                    <Hr style={hr} />
                    <Section align="right">
                        <Row>
                            <Column align="right">
                                <Text style={totalLabel}>Total</Text>
                                <Text style={totalValue}>₹{totalAmount}</Text>
                            </Column>
                        </Row>
                    </Section>
                    <Hr style={hr} />
                    <Text style={paragraph}>
                        If you have any questions, reply to this email or contact our support team.
                    </Text>
                    <Text style={footer}>
                        Atlas Agro Food CRM<br />
                        Automated System Message
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default OrderConfirmationEmail;

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
};

const orderInfo = {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    marginTop: "20px",
    marginBottom: "20px",
};

const label = {
    color: "#888",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    marginBottom: "5px",
};

const value = {
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "0",
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
};

const itemText = {
    fontSize: "14px",
    lineHeight: "1.4",
    color: "#484848",
    margin: "0",
};

const totalLabel = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#484848",
    marginRight: "10px",
};

const totalValue = {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#111",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
    lineHeight: "1.4",
    marginTop: "20px",
};
