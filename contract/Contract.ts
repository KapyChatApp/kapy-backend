import { OTPResponseDTO } from "@/dtos/OTPDTO";
import { SingleMessageResponseDTO } from "@/dtos/ShareDTO";
import { AuthenticationDTO, UserResponseDTO } from "@/dtos/UserDTO";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const Contract = c.router(
  {
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
          authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Create a admin",
        metadata: { role: "admin" } as const,
      },
      getAllUsers: {
        method: "GET",
        path: "/api/user/all",
        headers: z.object({
          auth: z.string()
        }),
        responses: {
          200: c.type<{ users: UserResponseDTO[]; total: number }>(),
        },
        summary: "Get all users",
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
        headers: z.object({}),
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
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
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
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
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
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          phonenumber: z.string(),
        }),
        summary: "Disable a user",
        metadata: { role: "admin" } as const,
      },
    }),
    friend: c.router({
      addFriend: {
        method: "POST",
        path: "/api/request/friend",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Add friend",
        metadata: { role: "user" } as const,
      },
      addBFF: {
        method: "POST",
        path: "/api/request/bff",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          Authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Add bestfriend",
        metadata: { role: "user" } as const,
      },
      block: {
        method: "POST",
        path: "/api/request/block",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          Authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Block a user",
        metadata: { role: "user" } as const,
      },
      acceptFriend: {
        method: "POST",
        path: "/api/request/accept-friend",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          Authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Accept a friend request",
        metadata: { role: "user" } as const,
      },
      acceptBFF: {
        method: "POST",
        path: "/api/request/accept-bff",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          Authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Accept a bestfriend request",
        metadata: { role: "user" } as const,
      },
      unFriend: {
        method: "POST",
        path: "/api/request/unfriend",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          Authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Unfriend",
        metadata: { role: "user" } as const,
      },
      unBFF: {
        method: "POST",
        path: "/api/request/unbff",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          Authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Unbestfriend",
        metadata: { role: "user" } as const,
      },
      unBlock: {
        method: "POST",
        path: "/api/request/unblock",
        responses: {
          201: c.type<SingleMessageResponseDTO>(),
        },
        body: z.object({
          sender: z.string(),
          receiver: z.string(),
        }),
        headers: z.object({
          Authorization: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Unblock",
        metadata: { role: "user" } as const,
      },
    }),
  },
  {
    baseHeaders: z.object({
      isOpenApi:z.boolean().default(true),
    }),
  }
);
