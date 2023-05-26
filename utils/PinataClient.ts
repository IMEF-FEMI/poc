
// Import necessary libraries
import axios from "axios";
import { Buffer } from "buffer/";
import { createHash } from "crypto"
import * as dotenv from 'dotenv'
dotenv.config()

export const IPFS_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs/";

// Define the class PinataClient
class PinataClient {
  // Define class variables
  apiKey;
  apiSecret;
  pinataJwt;

  constructor() {
    // Initialize class variables with environment variables
    this.apiKey = process.env.PINATA_API_KEY || "";
    this.apiSecret = process.env.PINATA_API_SECRET || "";
    this.pinataJwt = process.env.PINATA_JWT || "";
  }

  // Check if the jwt is valid
  async isJwtValid() {
    const response = await axios({
      method: "get",
      url: "https://api.pinata.cloud/data/testAuthentication",
      headers: {
        Authorization: `Bearer ${this.pinataJwt}`,
      },
    });

    return response.status === 200;
  }

  // Upload JSON to Pinata and returns the IPFS hash
  async uploadJson(filename: string, jsonData: { [key: string]: any }) {
    const data = JSON.stringify({
      pinataMetadata: {
        name: filename,
        keyvalues: {
          imageFilename: filename,
        },
      },
      pinataContent: jsonData,
    });
    
    const response = await axios({
      method: "post",
      url: `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      },
      data,
    });

    // calculate the hash and return the IPFS gateway URL

    return {
      hash: createHash("sha256").update(Buffer.from(JSON.stringify(jsonData))).digest("hex"),
      url: this.toGatewayUrl(response.data.IpfsHash),
    };
  }

  // Returns the IPFS hash gateway URL
  toGatewayUrl(ipfsHash: any) {
    return `${IPFS_GATEWAY_URL}/${ipfsHash}`;
  }
}

// Export PinataClient class
export { PinataClient };
