import {PutCommand,} from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import { UserRegistrationSchema } from "../data/validation.js"
import type { ErrorResponse, OperationResult } from "../data/types.js";
import { genSalt, hash } from 'bcrypt'
import { randomUUID } from "crypto";

const router: Router = express.Router()

interface User {
  pk: string
  sk: string
  name: string
  password: string
  Guest: boolean
}

interface UserRegistrationInput {
  name: string
  password: string
}

interface UserResponse {
  pk: string
  sk: string
  name: string
  Guest: boolean
}

// Generate a unique user ID
function generateUserId(): string {
  return randomUUID()
}

// User registration
router.post( "/", async (req: Request,res: Response<OperationResult<UserResponse> | ErrorResponse> ) => {
    // Validate input data
    const validationResult = UserRegistrationSchema.safeParse(req.body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }))

      return res.status(400).send({
        success: false,
        message: "Invalid user data",
        error: errors,
      })
    }

    const { name, password }: UserRegistrationInput = validationResult.data

    try {
      // Hash password
      const salt = await genSalt(10)
      const hashedPassword = await hash(password, salt)

      // Generate unique user ID
      const userId = generateUserId()

      // Create user object
      const newUser: User = {
        pk: "USERS",
        sk: `USER#${userId}`,
        name,
        password: hashedPassword,
        Guest: false,
      }

      // Save to database
      await db.send(
        new PutCommand({
          TableName: myTable,
          Item: newUser,
          ConditionExpression: "attribute_not_exists(sk)", // Prevent overwriting
        })
      )

      // Prepare response without password so we dont leak password
      const userResponse: UserResponse = {
        pk: newUser.pk,
        sk: newUser.sk,
        name: newUser.name,
        Guest: newUser.Guest,
      }

      return res.status(201).send({
        success: true,
        message: "User created successfully",
        item: userResponse,
      })
    } catch (error) {
      // Check if error is due to duplicate user
      if ((error as any).name === "ConditionalCheckFailedException") {
        return res.status(409).send({
          success: false,
          message: "User already exists",
          error: "A user with this ID already exists",
        })
      }

      // Generic error
      console.error("Error creating user:", error)
      return res.status(500).send({
        success: false,
        message: "Failed to create user",
        error: (error as Error).message,
      })
    }
  }
)

// create random guest
//lägg den nog i zustands
// då kanske man inte behöver en JWT för Guest i localStorage


export default router