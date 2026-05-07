import midtrans from "midtrans-client";
import crypto from "crypto";

const { Snap } = midtrans;

/**
 * Enterprise Payment Service for Midtrans Integration
 * Ensures PCI DSS compliance and Signature Key validation
 */
export class PaymentService {
  private static snapInstance: any = null;

  private static getSnap() {
    if (!this.snapInstance) {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const clientKey = process.env.MIDTRANS_CLIENT_KEY;

      if (!serverKey || serverKey.length < 5) {
        console.error("------------------------------------------------------------------");
        console.error("CRITICAL: MIDTRANS_SERVER_KEY is missing or invalid!");
        console.error("Please add MIDTRANS_SERVER_KEY to your Environment Variables.");
        console.error("------------------------------------------------------------------");
      }

      // @ts-ignore
      this.snapInstance = new Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        serverKey: serverKey || "DUMMY_KEY",
        clientKey: clientKey || "DUMMY_KEY"
      });
    }
    return this.snapInstance;
  }

  /**
   * Creates a Secure Snap Token for Checkout
   */
  static async createTransaction(orderId: string, amount: number, customerDetails: any) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    // Check if we are using placeholder keys or missing keys
    if (!serverKey || serverKey.includes("xxxx") || serverKey === "DUMMY_KEY") {
      console.log("------------------------------------------------------------------");
      console.log("OFFLINE MODE: Using mock payment token.");
      console.log("------------------------------------------------------------------");
      return { token: "MOCK_TOKEN_UI_UX_DEV", redirect_url: "#" };
    }

    const snap = this.getSnap();
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: customerDetails,
      credit_card: {
        secure: true // Mandatory for PCI DSS compliance
      },
      usage_limit: 1
    };

    const transaction = await snap.createTransaction(parameter);
    return transaction; // Contains token and redirect_url
  }

  /**
   * Validates Midtrans Notification Signature Key
   * CRITICAL for preventing payment spoofing/fraud
   */
  static validateSignature(notification: any): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    
    const payload = order_id + status_code + gross_amount + serverKey;
    const hash = crypto.createHash('sha512').update(payload).digest('hex');
    
    return hash === signature_key;
  }
}
