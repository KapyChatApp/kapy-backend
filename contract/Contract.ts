import { OTPResponseDTO } from "@/dtos/OTPDTO";
import { SingleMessageResponseDTO } from "@/dtos/ShareDTO";
import { AuthenticationDTO, UserResponseDTO } from "@/dtos/UserDTO";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const Contract = c.router({
  auth: c.router({
    login: {
      method: "POST",
      path: "/api/auth/login",
      responses: {
        200: c.type<AuthenticationDTO>(),
      },
      headers: z.object({}),
      body: z.object({
        phoneNumber: z.string(),
        password: z.string(),
      }),
      summary: "Login",
      metadata: { role: "guest" } as const,
    },
    logout: {
      method: "POST",
      path: "/api/auth/logout",
      responses: {
        200: c.type<SingleMessageResponseDTO>(),
      },
      body: z.object({}),
      headers: z.object({}),
      summary: "Logout",
      metadata: { role: "guest" } as const,
    },
    sendOTP: {
      method: "POST",
      path: "/api/auth/send-otp",
      responses: {
        200: c.type<OTPResponseDTO>(),
      },
      headers: z.object({}),
      body: z.object({
        phonenumber: z.string(),
      }),
      summary: "Get otp",
      metadata: { role: "guest" } as const,
    },
    verifyOTP: {
      method: "POST",
      path: "/api/auth/verify-otp",
      responses: {
        200: c.type<SingleMessageResponseDTO>(),
      },
      headers: z.object({}),
      body: z.object({
        phonenumber: z.string(),
      }),
      summary: "Verify otp",
      metadata: { role: "guest" } as const,
    },
  }),
  user: c.router({
    createAdmin: {
      method: "POST",
      path: "/api/user/create-admin",
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
      summary: "Create a admin",
      metadata: { role: "admin" } as const,
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
    register: {
      method: "POST",
      path: "/api/user/register",
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
      }),
      summary: "Register",
      metadata: { role: "guest" } as const,
    },
    updateUser: {
      method: "PATCH",
      path: "/api/user/update",
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
      summary: "Update a user",
      metadata: { role: "user" } as const,
    },
    disableUser: {
      method: "POST",
      path: "/api/user/disable",
      responses: {
        201: c.type<UserResponseDTO>(),
      },
      body: z.object({}),
      headers: z.object({
        Authorization: z
          .string()
          .regex(/^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/),
      }),
      query: z.object({
        id: z.string(),
      }),
      summary: "Disable a user",
      metadata: { role: "admin" } as const,
    },
    findUser: {
      method: "POST",
      path: "/api/user/find",
      responses: {
        201: c.type<UserResponseDTO>(),
      },
      body: z.object({}),
      headers: z.object({
        Authorization: z
          .string()
          .regex(/^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/),
      }),
      query: z.object({
        phonenumber: z.string(),
      }),
      summary: "Disable a user",
      metadata: { role: "admin" } as const,
    },
  }),
});
