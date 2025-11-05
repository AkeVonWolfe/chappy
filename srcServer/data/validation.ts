import { timeStamp } from "console";
import * as z from "zod";

const UserSchema = z.object({
  pk: z
    .string({
      message: "The primary key (pk) must be a string.",
    })
    .min(1, {
      message: "The primary key (pk) is required.",
    })
    .regex(/^USER#u\d+$/, {
      message: "The primary key (pk) must start with 'USER#' followed by a number (e.g., 'USER#123').",
    }),
  sk: z.literal("META", {
    message: "The Sort key (sk) must be exactly 'META'.",
  }),
  name: z
    .string({
      message: "Name must be a string.",
    })
    .min(1, {
      message: "Name is required.",
    }),
  password: z
    .string({
      message: "Password must be a string.",
    })
    .min(6, {
      message: "Password must be at least 6 characters long.",
    })
    .max(100, {
      message: "Password must be at most 100 characters long.",
    })
})

// TODO: move over validaton to middle ware ?
const IdSchema = z
  .number({
    message: "Id must be a number.",
  })
  .int({
    message: "Id must be an integer.",
  })

const messageSchema = z.object({
  message: z
    .string({
      message: "Message must be a string.",
    })
    .min(1, {
      message: "Message cannot be empty.",
    })
    .max(5000, {
      message: "Message must be at most 5000 characters long.",
    }),
  senderId: z
    .string({
      message: "Sender ID must be a string.",
    })
    .min(1, {
      message: "Sender ID cannot be empty.",
    }),
})
const UserRegistrationSchema = z.object({
  name: z
    .string({
      message: "Name must be a string.",
    })
    .min(1, {
      message: "Name is required.",
    })
    .max(100, {
      message: "Name must be at most 100 characters long.",
    }),
  password: z
    .string({
      message: "Password must be a string.",
    })
    .min(6, {
      message: "Password must be at least 6 characters long.",
    })
    .max(100, {
      message: "Password must be at most 100 characters long.",
    }),
})

const ChannelCreateSchema = z.object({
  name: z.string().min(1).max(100),
  userId: z.string(), // Temporary - remove when auth middleware is added
})



export { UserSchema, IdSchema, messageSchema, UserRegistrationSchema, ChannelCreateSchema }
