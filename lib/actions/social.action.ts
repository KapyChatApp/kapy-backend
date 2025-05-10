import Post from "@/database/post.model";
import { connectToDatabase } from "../mongoose";
import { PostResponseDTO } from "@/dtos/PostDTO";
import User from "@/database/user.model";
import { CommentResponseDTO } from "@/dtos/CommentDTO";
import { FileResponseDTO } from "@/dtos/FileDTO";
import { ShortUserResponseDTO } from "@/dtos/UserDTO";
import Comment from "@/database/comment.model";
import File from "@/database/file.model";
import { getMyBFFs } from "./mine.action";
import { Schema, Types } from "mongoose";

export const getAllBFFSocialPost = async (
  userId: Schema.Types.ObjectId | undefined,
  page: number,
  limit: number
): Promise<PostResponseDTO[]> => {
  await connectToDatabase();

  // 🧠 Lấy danh sách bạn bè
  const myBFFs = await getMyBFFs(userId);
  const bffObjectIds = myBFFs.map((bff) => new Types.ObjectId(bff._id));

  if (userId && !bffObjectIds.some((id) => id.equals(userId))) {
    bffObjectIds.push(new Types.ObjectId(userId));
  }

  // 🎯 Phân trang bằng cursor pagination: sort by createdAt và _id
  const posts = await Post.find({ userId: { $in: bffObjectIds } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

  if (!posts.length) return [];

  // 📦 Gom tất cả các ID liên quan
  const userIds = Array.from(new Set(posts.map((post) => post.userId.toString())));
  const fileIds = Array.from(new Set(posts.flatMap((post) => post.contentIds.map((id) => id.toString()))));
  const commentIds = Array.from(new Set(posts.flatMap((post) => post.comments.map((id) => id.toString()))));
  const tagUserIds = Array.from(new Set(posts.flatMap((post) => post.tagIds.map((id) => id.toString()))));

  // 🔄 Truy vấn dữ liệu liên quan
  const [users, files, comments, tagUsers] = await Promise.all([
    User.find({ _id: { $in: userIds } }).lean(),
    File.find({ _id: { $in: fileIds } }).lean(),
    Comment.find({ _id: { $in: commentIds } }).lean(),
    User.find({ _id: { $in: tagUserIds } }).lean(),
  ]);

  // 🧭 Tạo map nhanh
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const fileMap = new Map(files.map((file) => [file._id.toString(), file]));
  const commentMap = new Map(comments.map((comment) => [comment._id.toString(), comment]));
  const tagUserMap = new Map(tagUsers.map((user) => [user._id.toString(), user]));

  // 🧩 Gộp dữ liệu
  return posts.map((post) => {
    const user = userMap.get(post.userId.toString()) || {
      firstName: "",
      lastName: "",
      nickName: "",
      avatar: "",
    };

    const contents: FileResponseDTO[] = post.contentIds
      .map((id) => fileMap.get(id.toString()))
      .filter((file): file is FileResponseDTO => !!file);

    const commentsData: CommentResponseDTO[] = post.comments
      .map((id) => commentMap.get(id.toString()))
      .filter((comment): comment is CommentResponseDTO => !!comment);

    const tags: ShortUserResponseDTO[] = post.tagIds
      .map((id) => tagUserMap.get(id.toString()))
      .filter((user): user is ShortUserResponseDTO => !!user)
      .map((user) => ({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
      }));

    return {
      _id: post._id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      avatar: user.avatar,
      userId: post.userId,
      likedIds: post.likedIds,
      comments: commentsData,
      shares: post.shares,
      caption: post.caption,
      createAt: post.createAt,
      contents,
      tags,
      musicName: post.musicName,
      musicURL: post.musicURL,
      musicAuthor: post.musicAuthor,
      musicImageURL: post.musicImageURL,
    };
  });
};
