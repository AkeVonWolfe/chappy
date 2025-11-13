import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";


// AWS DynamoDB configuration
const accessKey: string = process.env.PUBLIC_KEY || "";
const secretAccessKey: string = process.env.SECRET_KEY || "";

// Initialize DynamoDB Client
const client: DynamoDBClient = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

const db: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

// Define your DynamoDB table name, and don't forget to use the correct table name
const myTable: string = "chappy";

export { db, myTable };
