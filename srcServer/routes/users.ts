import {  ScanCommand, DeleteCommand, UpdateCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult, LoginResponse } from "../data/types.js"
import bcrypt from "bcrypt"
import { createToken } from "../data/auth.js"


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
router.delete("/:id", async (req: Request<IdParam>, res: Response<OperationResult<User> | ErrorResponse>) => {
  try {
    const userId = req.params.id;

    const result = await db.send(
      new DeleteCommand({
        TableName: myTable,
        Key: {
          pk: "USERS",
          sk: `USER#${userId}`,
        },
        ConditionExpression: "attribute_exists(pk)",
        ReturnValues: "ALL_OLD",
      })
    );
    console.log("Deleting from table:", myTable)

    const deletedUser: User = result.Attributes as User;

    res.status(200).send({
      success: true,
      message: "User deleted successfully",
      item: deletedUser,
    });

  } catch (error: any) {

    console.log(" Delete user error:", error)

    if (error.name === "ConditionalCheckFailedException") {
      return res.status(404).send({
        success: false,
        error: "User not found",
        message: "Failed to delete user",
      })
    }

    res.status(500).send({
      success: false,
      error: error.message,
      message: "Failed to delete user",
    });
  }
})


// Login user
// Login user (by name + password)
router.post("/login", async (req: Request, res: Response<LoginResponse<User> | ErrorResponse>) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).send({
      success: false,
      error: "Name and password are required",
      message: "Name and password are required",
    });
  }

  try {
    // ✅ Query DynamoDB for a user with this name
    const result = await db.send(
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

    const user = result.Items && result.Items[0];

    if (!user) {
      return res.status(404).send({
        success: false,
        error: "User not found",
        message: "No user with that name exists",
      });
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({
        success: false,
        error: "Invalid credentials",
        message: "Incorrect password",
      });
    }

    //Extract user ID from SK
    const cleanId = user.sk.startsWith("USER#") ? user.sk.replace("USER#", "") : user.sk;

    const token = createToken({
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