import {  ScanCommand, DeleteCommand, UpdateCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult, LoginResponse } from "../data/types.js"
import bcrypt from "bcrypt"
import { createToken, verifyToken } from "../data/auth.js"


const router: Router = express.Router()


interface User {
  pk: string
  sk: string
  name: string
  password?: string
  Guest?: boolean
}

// Get all users
router.get("/", async (req, res: Response<SuccessResponse<User> | ErrorResponse>) => {
  try {
    const result: GetResult = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": "USERS",
          ":skPrefix": "USER#",
        },
      })
    )
    
    res.status(200).send({
      success: true,
      count: result.Count ?? 0,
      items: result.Items ?? [],
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Could not fetch users",
    })
  }
})


// DELETE user by id
router.delete("/:userId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;  // get authorization header
    if (!authHeader) {  // check if authorization header is missing
      return res.status(401).send({
        success: false,
        message: "Missing authorization header",
      });
    }

    const token = authHeader.split(" ")[1];  // extract token from "Bearer <token>"
    if (!token) {  // check if token is missing
      return res.status(401).send({
        success: false,
        message: "Invalid token format",
      });
    }

    const decoded = verifyToken(token);  // verify token
    if (!decoded) {  // invalid token
      return res.status(403).send({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const { userId } = req.params;  // get userId from params

    //  Only allow deleting own account
    if (decoded.userId !== userId) {  // check if user is authorized to delete this account
      return res.status(403).send({
        success: false,
        message: "You are not authorized to delete this account",
      });
    }

    //  Check if user exists
    const result = await db.send(
      new GetCommand({
        TableName: myTable,
        Key: {
          pk: "USERS",  // partition key for users
          sk: `USER#${userId}`,  // sort key for specific user
        },
      })
    );

    if (!result.Item) {  // user not found
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    //  Delete user
    await db.send(
      new DeleteCommand({  // delete user item from DB
        TableName: myTable,
        Key: {
          pk: "USERS",  // partition key for users
          sk: `USER#${userId}`,  // sort key for specific user
        },
      })
    );

    res.status(200).send({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({
      success: false,
      message: "Could not delete user account",
      error: (error as Error).message,
    });
  }
});


// Login user
// Login user (by name + password)
router.post("/login", async (req: Request, res: Response<LoginResponse<User> | ErrorResponse>) => {
  const { name, password } = req.body;

  if (!name || !password) {  // validate input
    return res.status(400).send({
      success: false,
      error: "Name and password are required",
      message: "Name and password are required",
    });
  }

  try {
    // Query DynamoDB for a user with this name
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",  // query by pk and sk prefix
        FilterExpression: "#name = :nameVal",  // filter by name
        ExpressionAttributeNames: {  
          "#name": "name",  // attribute name mapping
        },
        ExpressionAttributeValues: {  // attribute values for query
          ":pk": "USERS",  // partition key for users
          ":skPrefix": "USER#",  // sort key prefix for users
          ":nameVal": name,   // name to check
        },
      })
    );

    const user = result.Items && result.Items[0];  // get the first matching user
 
    if (!user) {  // user not found
      return res.status(404).send({
        success: false,
        error: "User not found",
        message: "No user with that name exists",
      });
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);  // compare hashed passwords
    if (!isPasswordValid) {  // invalid password
      return res.status(401).send({
        success: false,
        error: "Invalid credentials",
        message: "Incorrect password",
      });
    }

    //Extract user ID from SK
    const cleanId = user.sk.startsWith("USER#") ? user.sk.replace("USER#", "") : user.sk;  // clean user ID

    const token = createToken({  // create JWT token
      userId: cleanId,
      name: user.name,
    });

    res.status(200).send({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        userId: cleanId,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to log in user",
    });
  }
});

export default router