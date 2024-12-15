import {
  CommentResponseDTO,
  CreateCommentDTO,
  EditCommentDTO,
} from "@/dtos/CommentDTO";
import { createFile, getAFile } from "./file.action";
import Post from "@/database/post.model";
import Comment from "@/database/comment.model";
import User from "@/database/user.model";
import { FileResponseDTO } from "@/dtos/FileDTO";
import { connectToDatabase } from "../mongoose";
import { Schema } from "mongoose";

export const getAComment = async (commentId: string) => {
  try {
    connectToDatabase();
    const comment = await Comment.findById(commentId);
    const user = await User.findById(comment.userId);
    const repliedComments: CommentResponseDTO[] = [];
    if (comment.repliedIds.lenght != 0) {
      for (const repliedId of comment.repliedIds) {
        const repliedComment = await getAComment(repliedId);
        repliedComments.push(repliedComment);
      }
    }
    if (comment.contentId) {
      const fileResponse: FileResponseDTO = await getAFile(comment.contentId);
      const commentResponse: CommentResponseDTO = {
        _id: comment._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
        userId: user._id,
        likedIds: comment.likedIds,
        replieds: repliedComments,
        caption: comment.caption,
        createAt: comment.createAt,
        createBy: comment.createBy,
        content: fileResponse,
      };
      return commentResponse;
    } else {
      const commentResponse: CommentResponseDTO = {
        _id: comment._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
        userId: user._id,
        likedIds: comment.likedIds,
        replieds: repliedComments,
        caption: comment.caption,
        createAt: comment.createAt,
        createBy: comment.createBy,
      };
      return commentResponse;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const createComment = async (param: CreateCommentDTO) => {
  try {
    connectToDatabase();
    if (param.filesToUpload) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const file = await createFile(param.filesToUpload, param.userId?.toString()!);

      const fileResponse: FileResponseDTO = {
        _id: file._id,
        fileName: file.fileName,
        url: file.url,
        bytes: file.bytes,
        width: file.width,
        height: file.height,
        format: file.format,
        type: file.type,
      };
      const comment = await Comment.create({
        userId: param.userId,
        replyId: param.replyId,
        caption: param.caption,
        contentId: file._id,
        createBy: param.userId,
      });

      if (param.targetType === "post") {
        const post = await Post.findById(param.replyId);
        await post.comments.addToSet(comment._id);
        await post.save();
      } else {
        const repliedComment = await Comment.findById(param.replyId);
        await repliedComment.repliedIds.addToSet(comment._id);
        await repliedComment.save();
      }

      const user = await User.findById(param.userId);

      const commentResponse: CommentResponseDTO = {
        _id: comment._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
        userId: user._id,
        likedIds: comment.likedIds,
        replieds: comment.repliedIds,
        caption: comment.caption,
        createAt: comment.createAt,
        content: fileResponse,
        createBy: comment.createBy,
      };
      return commentResponse;
    } else {
      const comment = await Comment.create({
        userId: param.userId,
        replyId: param.replyId,
        caption: param.caption?.toString(),
        contentId: null,
        createBy: param.userId,
      });

      if (param.targetType === "post") {
        const post = await Post.findById(param.replyId);
        await post.comments.addToSet(comment._id);
        await post.save();
      } else {
        const repliedComment = await Comment.findById(param.replyId);
        await repliedComment.repliedIds.addToSet(comment._id);
        await repliedComment.save();
      }

      const user = await User.findById(param.userId);

      const commentResponse: CommentResponseDTO = {
        _id: comment._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
        userId: user._id,
        likedIds: comment.likedIds,
        replieds: comment.repliedIds,
        caption: comment.caption,
        createAt: comment.createAt,
        createBy: comment.createBy,
      };
      return commentResponse;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const likeComment = async (
  commentId: string,
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    connectToDatabase();
    const comment = await Comment.findById(commentId);
    await comment.likedIds.addToSet(userId);
    await comment.save();
    return { message: `Liked ${commentId}` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const disLikeComment = async (
  commentId: string,
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    connectToDatabase();
    const comment = await Comment.findById(commentId);
    await comment.likedIds.pull(userId);
    await comment.save();
    return { message: `Disliked comment ${commentId}` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const editComment = async (
  id: string,
  userId: Schema.Types.ObjectId | undefined,
  editContent: EditCommentDTO
) => {
  try {
    console.log("Edit content: ", editContent);
    const comment = await Comment.findById(id);
    if (!comment) {
      return { message: "Comment not exist!" };
    }
    if (comment.createBy.toString() != userId?.toString()) {
      return { message: "You cannot edit this comment!" };
    }
    if (editContent.keepOldContent) {
      comment.caption = editContent.caption;
      await comment.save();
      return await getAComment(id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const file = await createFile(editContent.content!, userId?.toString()!);
      comment.contentId = file._id;
      await comment.save();
      return await getAComment(id);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteComment = async (
  id: string,
  userId: Schema.Types.ObjectId
) => {
  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return { message: "Post not exist!" };
    }
    if (userId.toString() != comment.createBy) {
      return { message: "You cannot delete this comment!" };
    }
    await Comment.findOneAndDelete({ _id: id });
    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
