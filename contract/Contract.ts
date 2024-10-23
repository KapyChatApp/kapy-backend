import {
  AuthenticationDTO,
  UserLoginDTO,
  UserResponseDTO,
} from "@/dtos/UserDTO";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const Contract = c.router({
  auth: c.router({
    login: {
      method: "POST",
      path: "/api/auth/login",
      responses: {
        201: c.type<AuthenticationDTO>(),
      },
      headers: z.object({}),
      body: z.object({
        phoneNumber: z.string(),
        password: z.string(),
      }),
      summary: "Login",
      metadata: { role: "guest" } as const,
    },
  }),
  user: c.router({
    createUser: {
      method: "POST",
      path: "/api/user/create",
      responses: {
        201: c.type<UserResponseDTO>(),
      },
      body: z.object({
        firstName: z.string(),
        lastName: z.string(),
        nickName: z.string().optional(),
        phoneNumber: z.string(),
        email: z.string().email(),
        password: z.string(),
        rePassword: z.string(),
        gender: z.boolean(),
        address: z.string(),
        birthDay: z.date(),
      }),
      headers: z.object({
        Authorization: z
          .string()
          .regex(/^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/),
      }),
      summary: "Create a user",
      metadata: { role: "user" } as const,
    },
    getAllUsers: {
      method: "GET",
      path: "/api/user/all",
      responses: {
        200: c.type<{ users: UserResponseDTO[]; total: number }>(),
      },
      headers: z.object({
        Authorization: z
          .string()
          .regex(/^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/),
      }),
      summary: "Get all users",
      metadata: { role: "admin" } as const,
    },
  }),
});
