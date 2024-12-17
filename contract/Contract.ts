import {
  MessageBoxGroupDTO,
  MessageBoxDTO,
  ResponseMessageDTO,
  DetailMessageBoxDTO,
  ResponseAMessageBoxDTO,
  TextingEvent,
  ResponseReactMessageDTO,
} from "@/dtos/MessageDTO";
import { FriendResponseDTO } from "@/dtos/FriendDTO";
import { OTPResponseDTO } from "@/dtos/OTPDTO";
import { SingleMessageResponseDTO } from "@/dtos/ShareDTO";
import {
  AuthenticationDTO,
  OnlineEvent,
  ShortUserResponseDTO,
  UserResponseDTO,
} from "@/dtos/UserDTO";
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { MediaResponseDTO } from "@/dtos/MediaDTO";
import { PointResponseDTO } from "@/dtos/PointDTO";
import { ReportResponseDTO } from "@/dtos/ReportDTO";
import { FileResponseDTO } from "@/dtos/FileDTO";
import { StickerResponseDTO } from "@/dtos/StickerDTO";

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
          auth: z
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
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
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
          auth: z
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
          auth: z
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
        method: "GET",
        path: "/api/user/find",
        responses: {
          201: c.type<UserResponseDTO>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          phonenumber: z.string().optional(),
          userId: z.string().optional(),
        }),
        summary: "Disable a user",
        metadata: { role: "admin" } as const,
      },
      onlineEvent: {
        method: "POST",
        path: "/api/user/online",
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        body: z.object({}),
        responses: {
          200: c.type<OnlineEvent>(),
          400: c.type<{ success: false; message: string }>(),
          500: c.type<{ success: false; message: string }>(),
        },
        summary: "Create online event",
        description: "Creates online event.",
        metadata: { role: "user" } as const,
      },
      offlineEvent: {
        method: "POST",
        path: "/api/user/offline",
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        body: z.object({}),
        responses: {
          200: c.type<OnlineEvent>(),
          400: c.type<{ success: false; message: string }>(),
          500: c.type<{ success: false; message: string }>(),
        },
        summary: "Create offline event",
        description: "Creates offline event.",
        metadata: { role: "user" } as const,
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
          auth: z
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
          auth: z
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
          auth: z
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
          auth: z
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
          auth: z
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
          auth: z
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
          auth: z
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
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Unblock",
        metadata: { role: "user" } as const,
      },
      requestFriendProfile: {
        method: "GET",
        path: "/api/friend/profile",
        responses: {
          201: c.type<UserResponseDTO>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          friendId: z.string(),
        }),
        summary: "Friend Profile",
        metadata: { role: "user" } as const,
      },
      find: {
        method: "GET",
        path: "/api/friend/find",
        responses: {
          200: c.type<UserResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          q: z.string(),
        }),
        summary: "Find friend regex",
        metadata: { role: "user" } as const,
      },
      mutual: {
        method: "GET",
        path: "/api/friend/mutual",
        responses: {
          200: c.type<ShortUserResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          friendId: z.string(),
        }),
        summary: "Mutual friends",
        metadata: { role: "user" } as const,
      },
    }),
    mine: c.router({
      profile: {
        method: "GET",
        path: "/api/mine/profile",
        responses: {
          201: c.type<UserResponseDTO>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "My Profile",
        metadata: { role: "user" } as const,
      },
      friends: {
        method: "GET",
        path: "/api/mine/friends",
        responses: {
          201: c.type<FriendResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "My Friends",
        metadata: { role: "user" } as const,
      },
      bffs: {
        method: "GET",
        path: "/api/mine/bffs",
        responses: {
          201: c.type<FriendResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "My estfriends",
        metadata: { role: "user" } as const,
      },
      blocks: {
        method: "GET",
        path: "/api/mine/blocks",
        responses: {
          201: c.type<FriendResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "My Blocks",
        metadata: { role: "user" } as const,
      },
      requested: {
        method: "GET",
        path: "/api/mine/requested",
        responses: {
          201: c.type<FriendResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "My Requested",
        metadata: { role: "user" } as const,
      },
    }),
    message: c.router({
      all: {
        method: "GET",
        path: "/api/message/all",
        responses: {
          200: c.type<ResponseMessageDTO[]>(),
          400: c.type<{ message: string }>(),
          404: c.type<{ message: string }>(),
          500: c.type<{ message: string; error?: string }>(),
        },
        query: z.object({
          boxId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all messages of a certain message-box",
        description:
          "Fetches all messages for a specific message-box using its `boxId`.",
      },
      createGroup: {
        method: "POST",
        path: "/api/message/create-group",
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        body: z.object({
          membersIds: z.array(z.string()).nonempty(),
          leaderId: z.string(),
        }),
        responses: {
          200: c.type<{
            success: true;
            message: string;
            newBox: MessageBoxDTO;
          }>(),
          400: c.type<{ success: false; message: string }>(),
          500: c.type<{ success: false; message: string }>(),
        },
        summary: "Create a new group",
        description:
          "Creates a new group with specified member IDs and the name and ava of group.",
        metadata: { role: "user" } as const,
      },
      deleteMessage: {
        method: "DELETE",
        path: "/api/message/delete",
        responses: {
          200: c.type<{
            success: boolean;
            messageId?: string;
            message?: string;
          }>(),
          400: c.type<{
            success: boolean;
            message: string;
          }>(),
          401: c.type<{
            success: boolean;
            message: string;
          }>(),
          500: c.type<{
            success: boolean;
            message: string;
          }>(),
        },
        query: z.object({
          messageId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Delete a message",
        metadata: { role: "user" } as const,
      },
      editMessage: {
        method: "PUT",
        path: "/api/message/edit",
        responses: {
          200: c.type<{
            success: boolean;
            message: ResponseMessageDTO;
          }>(),
          400: c.type<{
            success: boolean;
            message: string;
          }>(),
          401: c.type<{
            success: boolean;
            message: string;
          }>(),
          500: c.type<{
            message: string;
            error?: string;
          }>(),
        },
        body: z.object({
          messageId: z.string(),
          newContent: z.any(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Edit a text message",
        metadata: { role: "user" } as const,
      },
      markAsRead: {
        method: "POST",
        path: "/api/message/mark-read",
        responses: {
          200: c.type<{
            success: boolean;
            messages: string;
          }>(),
        },
        body: z.object({
          boxId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({}),
        summary: "Mark messages as read",
        metadata: { role: "user" } as const,
      },
      checkMarkAsRead: {
        method: "POST",
        path: "/api/message/mark-read",
        responses: {
          200: c.type<{
            success: boolean;
            messages: string;
          }>(),
        },
        body: z.object({
          boxIds: z.array(z.string()).nonempty(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({}),
        summary: "Check mark messages as read at all boxId",
        metadata: { role: "user" } as const,
      },
      revokeMessage: {
        method: "DELETE",
        path: "/api/message/revoke",
        responses: {
          200: c.type<{
            success: boolean;
            message: string;
          }>(),
          400: c.type<{
            success: boolean;
            message: string;
          }>(),
          401: c.type<{
            success: boolean;
            message: string;
          }>(),
          500: c.type<{
            success: boolean;
            message: string;
          }>(),
        },
        query: z.object({
          messageId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Revoke a message",
      },
      findMessages: {
        method: "GET",
        path: "/api/message/find",
        responses: {
          200: c.type<{
            success: boolean;
            messages: ResponseMessageDTO[];
          }>(),
          500: c.type<{
            success: boolean;
            message: string;
          }>(),
        },
        query: z.object({
          query: z.string().optional(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Search messages by query",
        metadata: { role: "user" } as const,
      },
      sendMessage: {
        method: "POST",
        path: "/api/message/send",
        responses: {
          200: c.type<{
            success: boolean;
            message: string;
          }>(),
          500: c.type<{
            success: boolean;
            message: string;
          }>(),
        },
        body: z.union([
          // Trường hợp `content` là string[]
          z.object({
            boxId: z.string(),
            content: z.string(),
          }),
          // Trường hợp `content` là file JSON
          z.object({
            boxId: z.string(),
            content: z.object({
              fileName: z.string(),
              url: z.string(),
              publicId: z.string(),
              bytes: z.string(),
              width: z.string(),
              height: z.string(),
              format: z.string(),
              type: z.string(),
            }),
          }),
        ]),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Send a message",
        metadata: { role: "user" } as const,
      },
      textingEvent: {
        method: "POST",
        path: "/api/message/texting",
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        body: z.object({
          boxId: z.string(),
          avatar: z.string(),
        }),
        responses: {
          200: c.type<TextingEvent>(),
          400: c.type<{ success: false; message: string }>(),
          500: c.type<{ success: false; message: string }>(),
        },
        summary: "Create texting event",
        description: "Creates texting event in a box chat.",
        metadata: { role: "user" } as const,
      },
      disableTextingEvent: {
        method: "POST",
        path: "/api/message/disable-texting",
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        body: z.object({
          boxId: z.string(),
          avatar: z.string(),
        }),
        responses: {
          200: c.type<TextingEvent>(),
          400: c.type<{ success: false; message: string }>(),
          500: c.type<{ success: false; message: string }>(),
        },
        summary: "Create texting event",
        description: "Creates texting event in a box chat.",
        metadata: { role: "user" } as const,
      },
      aBoxChat: {
        method: "GET",
        path: "/api/message/get-info-box-chat",
        responses: {
          200: c.type<{
            box: DetailMessageBoxDTO;
          }>(),
          400: c.type<{
            success: false;
            box: string;
          }>(),
          404: c.type<{
            success: false;
            box: string;
          }>(),
          500: c.type<{
            success: false;
            error?: string;
          }>(),
        },
        query: z.object({
          boxId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all message box of a certain user",
        description:
          "Fetches all message box for a specific user using its `userId`.",
      },
      aBoxChatMobile: {
        method: "GET",
        path: "/api/message/a-messagebox",
        responses: {
          200: c.type<{
            success: true;
            box: ResponseAMessageBoxDTO;
          }>(),
          400: c.type<{
            success: false;
            box: string;
          }>(),
          404: c.type<{
            success: false;
            box: string;
          }>(),
          500: c.type<{
            success: false;
            error?: string;
          }>(),
        },
        query: z.object({
          boxId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all message box of a certain user",
        description:
          "Fetches all message box for a specific user using its `userId`.",
      },
      allChat: {
        method: "GET",
        path: "/api/message/all-box-chat",
        responses: {
          200: c.type<{
            success: true;
            box: MessageBoxDTO[];
          }>(),
          400: c.type<{
            success: false;
            box: string;
          }>(),
          404: c.type<{
            success: false;
            box: string;
          }>(),
          500: c.type<{
            success: false;
            error?: string;
          }>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all message box of a certain user",
        description:
          "Fetches all message box for a specific user using its `userId`.",
      },
      allGroup: {
        method: "GET",
        path: "/api/message/all-box-group",
        responses: {
          200: c.type<{
            success: true;
            box: MessageBoxGroupDTO[];
          }>(),
          400: c.type<{
            success: false;
            box: string;
          }>(),
          404: c.type<{
            success: false;
            box: string;
          }>(),
          500: c.type<{
            success: false;
            error?: string;
          }>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all message box group of a certain group",
        description:
          "Fetches all message box for a specific group using its `groupId`.",
      },
      listFiles: {
        method: "GET",
        path: "/api/message/files",
        responses: {
          200: c.type<FileResponseDTO[]>(),
          400: c.type<{
            message: string;
          }>(),
          404: c.type<{
            message: string;
          }>(),
          500: c.type<{
            message: string;
          }>(),
        },
        query: z.object({
          boxId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get file list in message box",
        description: "Get the file list in `boxId`.",
      },
      reactMessage: {
        method: "POST",
        path: "/api/message/react",
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        body: z.object({
          messageId: z.string(),
        }),
        responses: {
          200: c.type<ResponseReactMessageDTO>(),
          400: c.type<{ success: false; message: string }>(),
          500: c.type<{ success: false; message: string }>(),
        },
        summary: "React message",
        description: "Message is reacted or not.",
        metadata: { role: "user" } as const,
      },
      listMessages: {
        method: "GET",
        path: "/api/message/management/list",
        responses: {
          200: c.type<{
            success: boolean;
            messages: ResponseMessageDTO[];
          }>(),
          404: c.type<{
            success: boolean;
            message: string;
          }>(),
          500: c.type<{
            message: string;
            error?: string;
          }>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all messages from the management list",
        metadata: { role: "admin" } as const,
      },
      removeMessage: {
        method: "DELETE",
        path: "/api/message/management/remove",
        responses: {
          200: c.type<{
            success: boolean;
            message: string;
          }>(),
          400: c.type<{
            success: boolean;
            message: string;
          }>(),
          401: c.type<{
            success: boolean;
            message: string;
          }>(),
          500: c.type<{
            success: boolean;
            message: string;
          }>(),
        },
        query: z.object({
          messageId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Remove a message from database",
        metadata: { role: "admin" } as const,
      },
      searchMessages: {
        method: "GET",
        path: "/api/message/management/search",
        responses: {
          200: c.type<{
            success: boolean;
            messages: ResponseMessageDTO[];
          }>(),
          404: c.type<{
            success: boolean;
            message: string;
          }>(),
          500: c.type<{
            success: boolean;
            message: string;
            error?: string;
          }>(),
        },
        query: z.object({
          id: z.string().optional(),
          query: z.string().optional(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Search messages by ID and query",
        metadata: { role: "admin" } as const,
      },
      media: c.router({
        uploadAvatar: {
          method: "POST",
          path: "/api/media/upload-avatar",
          contentType: "multipart/form-data",
          description: "Upload an avatar image for the authenticated user",
          responses: {
            200: c.type<MediaResponseDTO>(),
            400: c.type<MediaResponseDTO>(),
            405: c.type<MediaResponseDTO>(),
            500: c.type<MediaResponseDTO>(),
          },
          headers: z.object({
            auth: z
              .string()
              .regex(
                /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
              ),
          }),
          body: c.type<{ file: File }>(),
          summary: "Upload user avatar image",
        },
        uploadBackground: {
          method: "POST",
          path: "/api/media/upload-background",
          description: "Upload a background image for the authenticated user",
          contentType: "multipart/form-data",
          responses: {
            200: c.type<MediaResponseDTO>(),
            400: c.type<MediaResponseDTO>(),
            405: c.type<MediaResponseDTO>(),
            500: c.type<MediaResponseDTO>(),
          },
          headers: z.object({
            auth: z
              .string()
              .regex(
                /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
              ),
          }),
          body: c.type<{ file: File }>(),
          summary: "Upload user background image",
        },
      }),
    }),
    point: c.router({
      plus: {
        method: "PATCH",
        path: "/api/point/plus",
        description: "add point for user",
        responses: {
          200: c.type(),
        },
        query: z.object({
          userId: z.string(),
          point: z.number(),
        }),
        body: z.object({}),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Plus user point",
        metadata: { role: "admin" } as const,
      },
      minus: {
        method: "PATCH",
        path: "/api/point/minus",
        description: "minus point for user",
        responses: {
          200: c.type(),
        },
        query: z.object({
          userId: z.string(),
          point: z.number(),
        }),
        body: z.object({}),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Minus user point",
        metadata: { role: "admin" } as const,
      },
      all: {
        method: "GET",
        path: "/api/point/all",
        responses: {
          200: c.type<PointResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all rate",
        metadata: { role: "admin" } as const,
      },
      user: {
        method: "GET",
        path: "/api/point/user",
        responses: {
          200: c.type<PointResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          userId: z.string(),
        }),
        summary: "Get all rate of a user",
        metadata: { role: "user" } as const,
      },
      delete: {
        method: "DELETE",
        path: "/api/point/delete",
        description: "Delete a rate for admin",
        responses: {
          200: c.type(),
        },
        query: z.object({
          pointId: z.string(),
        }),
        body: z.object({}),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Delete a rate for admin",
        metadata: { role: "admin" } as const,
      },
      create: {
        method: "POST",
        path: "/api/point/create",
        description: "Create a rate",
        responses: {
          200: c.type<PointResponseDTO>(),
        },
        body: z.object({
          userId: z.string(),
          point: z.number(),
          message: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Create a rate",
        metadata: { role: "user" } as const,
      },
      edit: {
        method: "PATCH",
        path: "/api/point/edit",
        description: "Edit a rate",
        responses: {
          200: c.type<PointResponseDTO>(),
        },

        body: z.object({
          point: z.number(),
          message: z.string(),
        }),
        query: z.object({
          pointId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Edit a rate",
        metadata: { role: "user" } as const,
      },
      deleteMy: {
        method: "DELETE",
        path: "/api/point/delete-my",
        description: "Delete my rate",
        responses: {
          200: c.type<PointResponseDTO>(),
        },
        query: z.object({
          pointId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Delete my rate",
        metadata: { role: "user" } as const,
      },
    }),
    report: c.router({
      all: {
        method: "GET",
        path: "/api/report/all",
        responses: {
          200: c.type<ReportResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get all reports",
        metadata: { role: "admin" } as const,
      },
      mine: {
        method: "GET",
        path: "/api/report/mine",
        responses: {
          200: c.type<ReportResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Get my reports",
        metadata: { role: "user" } as const,
      },
      create: {
        method: "POST",
        path: "/api/report/create",
        description: "Create a report",
        responses: {
          200: c.type<ReportResponseDTO>(),
        },
        body: z.object({
          content: z.string(),
          targetId: z.string(),
          targetType: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Create a report",
        metadata: { role: "user" } as const,
      },
      update: {
        method: "PATCH",
        path: "/api/report/update",
        description: "Update a report",
        responses: {
          200: c.type<PointResponseDTO>(),
        },

        body: z.object({
          content: z.string(),
        }),
        query: z.object({
          reportId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Update a report",
        metadata: { role: "user" } as const,
      },
      verify: {
        method: "PATCH",
        path: "/api/report/verify",
        responses: {
          200: c.type<PointResponseDTO>(),
        },
        body: z.object({
          status: z.string(),
        }),
        query: z.object({
          reportId: z.string(),
        }),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        summary: "Verify a report",
        metadata: { role: "admin" } as const,
      },
    }),
    sticker: c.router({
      a: {
        method: "GET",
        path: "/api/sticker/asticker",
        description: "Get a sticker by Id",
        responses: {
          200: c.type<StickerResponseDTO>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          stickerId: z.string(),
        }),
      },
      all: {
        method: "GET",
        path: "/api/sticker/all",
        description: "Get all sticker",
        responses: {
          200: c.type<StickerResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
      },
      find: {
        method: "GET",
        path: "/api/sticker/find",
        description: "Get find stickers",
        responses: {
          200: c.type<StickerResponseDTO[]>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        query: z.object({
          q: z.string(),
        }),
      },
      create: {
        method: "POST",
        path: "/api/sticker/create",
        description: "Create a sticker",
        responses: {
          200: c.type<{ message: string }>(),
        },
        body: c.type<{ name: string; file: File }>(),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        metadata: { role: "user" } as const,
      },
      update: {
        method: "PATCH",
        path: "/api/sticker/update",
        description: "Update a sticker",
        responses: {
          200: c.type<{ message: string }>(),
        },
        body: c.type<{ name: string; file: File }>(),
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        metadata: { role: "user" } as const,
      },
      delete: {
        method: "DELETE",
        path: "/api/sticker/delete",
        description: "Delete a sticker",
        responses: {
          200: c.type<{ message: string }>(),
        },
        headers: z.object({
          auth: z
            .string()
            .regex(
              /^Bearer\s[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
            ),
        }),
        metadata: { role: "user" } as const,
      },
    }),
  },
  {
    baseHeaders: z.object({
      isOpenApi: z.boolean().default(true),
    }),
  }
);
