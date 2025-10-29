import {PutCommand,} from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import { UserSchema } from "../data/validation.js"
import type { ErrorResponse, OperationResult } from "../data/types.js";

const router: Router = express.Router()

interface User {
  pk: string;
  sk: string;
  name: string;
}


// Create new user
router.post("/", async (req: Request<User>, res: Response<OperationResult<User> | ErrorResponse>) => {

  //TODO: put valdiaton as middleware?
  let validationResult = UserSchema.safeParse(req.body); // validate input data
  
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    // if validation fails
    return res.status(400).send({
      success: false,
      message: "Invalid user data",
      error: errors,
    });
  }
  
  const newUser: User = validationResult.data; // get validated data
  
  try {
    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: newUser,
        ConditionExpression: "attribute_not_exists(pk)", // prevent overwriting existing user
      })
    );
    res.status(201).send({
      success: true,
      message: "User created successfully",
      item: newUser,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "failed to create user",
    });
  }
})

// crate radom guest
//lägg den nog i zustands
// då kanske man inte behöver en JWT för Guest i localStorage


export default router