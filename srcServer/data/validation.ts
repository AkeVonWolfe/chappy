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
})

const IdSchema = z
  .number({
    message: "Id must be a number.",
  })
  .int({
    message: "Id must be an integer.",
  })

const messageSchema = z.object({
  pk: z
    .string({
      message: "The primary key (pk) must be a string.",
    })
    .min(1, {
      message: "The primary key (pk) is required.",
    })  //  + * ?     ka -> pannkaka
    .regex(/^USER#u\d+$/, {
      message: "The primary key (pk) must start with 'USER#' followed by a number (e.g., 'USER#123').",
    }),

  sk: z.literal("META", {
    message: "The Sort key (sk) must be exactly 'META'.",
  }),

  message: z
   .string({
    
   })
   .min(1,{
    message: "Cannot be empty"
   }),

   timestamp: z 
   .number({
    message: "Timestamp must be a number"
   })
   .min(1, {
    message: "Timestamp cannot be empty"
   })
})


export { UserSchema, IdSchema, messageSchema }
