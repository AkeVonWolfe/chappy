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

    if (!name || !password) {
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
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
          FilterExpression: "#name = :nameVal",
          ExpressionAttributeNames: {
            "#name": "name",
          },
          ExpressionAttributeValues: {
            ":pk": "USERS",
            ":skPrefix": "USER#",
            ":nameVal": name,
          },
        })
      );

      if (existing.Items && existing.Items.length > 0) {
        return res.status(409).send({
          success: false,
          message: "User already exists",
        });
      }

      //  Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = randomUUID();

      // Save user
      const newUser = {
        pk: "USERS",
        sk: `USER#${userId}`,
        name,
        password: hashedPassword,
        Guest: false,
      };

      await db.send(
        new PutCommand({
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