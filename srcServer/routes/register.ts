import {PutCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import { UserRegistrationSchema } from "../data/validation.js"
import type { ErrorResponse, OperationResult } from "../data/types.js";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const router: Router = express.Router()

interface RegisterBody {
  name: string;
  password: string;
}

// User registration
router.post(
  "/register",
  async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const { name, password } = req.body;

    if (!name || !password) {  // validate input
      return res.status(400).send({
        success: false,
        message: "Name and password are required",
      });
    }

    try {
      //  Check if user already exists
      const existing = await db.send(
        new QueryCommand({
          TableName: myTable,
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",  // query by pk and sk prefix
          FilterExpression: "#name = :nameVal",   // filter by name
          ExpressionAttributeNames: {
            "#name": "name",  // attribute name mapping
          },
          ExpressionAttributeValues: {  // attribute values for query
            ":pk": "USERS",  // partition key for users
            ":skPrefix": "USER#",  // sort key prefix for users
            ":nameVal": name,  // name to check
          },
        })
      );

      if (existing.Items && existing.Items.length > 0) {  // user exists
        return res.status(409).send({
          success: false,
          message: "User already exists",
        });
      }

      //  Hash password
      const hashedPassword = await bcrypt.hash(password, 10);  // salt rounds = 10 computaing power
      const userId = randomUUID();  // generate unique user ID

      // Save user
      const newUser = {
        pk: "USERS",  // partition key for users
        sk: `USER#${userId}`,  // sort key with user ID
        name,  // user name
        password: hashedPassword,  // hashed password
        Guest: false,  // not a guest user
      };

      await db.send(
        new PutCommand({  // save new user to DB
          TableName: myTable,
          Item: newUser,
        })
      );

      res.status(201).send({
        success: true,
        message: "User registered successfully",
        user: {
          userId,
          name,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).send({
        success: false,
        message: "Failed to register user",
        error: (error as Error).message,
      });
    }
  }
);

export default router;