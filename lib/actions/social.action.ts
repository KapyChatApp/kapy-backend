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
import { Schema } from "mongoose";

export const getAllBFFSocialPost = async (
  userId: Schema.Types.ObjectId | undefined,
  page: number,
  limit: number
): Promise<PostResponseDTO[]> => {
  await connectToDatabase();
  const skip = (page - 1) * limit;

  // 🏆 1. Lấy danh sách bạn bè (BFFs)
  const myBFFs = await getMyBFFs(userId);
  const bffIds = myBFFs.map((bff) => bff._id.toString());

  if (userId && !bffIds.includes(userId.toString())) {
    bffIds.push(userId.toString());
  }

  // 🏆 2. Truy vấn danh sách bài viết
  const posts = await Post.find({ userId: { $in: bffIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (!posts.length) return [];

  // 🏆 3. Lấy tất cả userId, fileId và commentId trong một lần truy vấn
  const userIds = Array.from(new Set(posts.map((post) => post.userId.toString())));
  const allFileIds = Array.from(new Set(posts.flatMap((post) => post.contentIds.map((id) => id.toString()))));
  const allCommentIds = Array.from(new Set(posts.flatMap((post) => post.comments.map((id) => id.toString()))));
  const tagUserIds = Array.from(new Set(posts.flatMap((post) => post.tagIds.map((id) => id.toString()))));

  // 🏆 4. Truy vấn dữ liệu một lần duy nhất
  const [users, files, comments, tagUsers] = await Promise.all([
    User.find({ _id: { $in: userIds } }).lean(),
    File.find({ _id: { $in: allFileIds } }).lean(),
    Comment.find({ _id: { $in: allCommentIds } }).lean(),
    User.find({ _id: { $in: tagUserIds } }).lean(),
  ]);

  // 🏆 5. Tạo Map để tra cứu nhanh
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const fileMap = new Map(files.map((file) => [file._id.toString(), file]));
  const commentMap = new Map(comments.map((comment) => [comment._id.toString(), comment]));
  const tagUserMap = new Map(tagUsers.map((user) => [user._id.toString(), user]));

  // 🏆 6. Xử lý dữ liệu và trả về kết quả
  return posts.map((post) => {
    const user = userMap.get(post.userId.toString()) || { firstName: "", lastName: "", nickName: "", avatar: "" };
    
    // Xử lý danh sách file
    const filesResponse: FileResponseDTO[] = post.contentIds
      .map((id) => fileMap.get(id.toString()))
      .filter((file): file is FileResponseDTO => !!file);

    // Xử lý danh sách comment
    const commentResponses: CommentResponseDTO[] = post.comments
      .map((id) => commentMap.get(id.toString()))
      .filter((comment): comment is CommentResponseDTO => !!comment);

    // Xử lý danh sách tag
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
      comments: commentResponses,
      shares: post.shares,
      caption: post.caption,
      createAt: post.createAt,
      contents: filesResponse,
      tags: tags,
      musicName: post.musicName,
      musicURL: post.musicURL,
      musicAuthor: post.musicAuthor,
      musicImageURL: post.musicImageURL,
    };
  });
};
