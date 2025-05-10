import {
  CheckedPostReponse,
  CreatePostDTO,
  EditPostDTO,
  PostResponseDTO,
  PostResponseManageDTO
} from "@/dtos/PostDTO";
import { connectToDatabase } from "../mongoose";
import mongoose, { Schema } from "mongoose";
import Post from "@/database/post.model";
import formidable from "formidable";
import { createFile } from "./file.action";
import User from "@/database/user.model";
import File from "@/database/file.model";
import { FileResponseDTO } from "@/dtos/FileDTO";
import { findPairUser } from "./user.action";
import Relation from "@/database/relation.model";
import { CommentResponseDTO } from "@/dtos/CommentDTO";
import Comment from "@/database/comment.model";
import { getAComment } from "./comment.action";
import _ from "lodash";
import { ShortUserResponseDTO } from "@/dtos/UserDTO";

export const getAPost = async (
  postId: string,
  userId: Schema.Types.ObjectId
) => {
  try {
    connectToDatabase();
    const post = await Post.findById(postId);
    const [stUserId, ndUserId] = [
      post.userId.toString(),
      userId.toString()
    ].sort();
    if (userId.toString() != post.userId.toString()) {
      const relation = await Relation.findOne({
        stUser: stUserId,
        ndUser: ndUserId,
        relation: "bff",
        status: true
      });
      if (!relation) {
        return false;
      }
    }
    const user = await User.findById(post.userId);
    const fileOfPost = await File.find({
      _id: { $in: post.contentIds }
    }).exec();
    const filesResponse: FileResponseDTO[] = [];
    for (const file of fileOfPost) {
      const fileResponse: FileResponseDTO = {
        _id: file._id,
        url: file.url,
        fileName: file.fileName,
        width: file.width,
        height: file.height,
        format: file.format,
        bytes: file.bytes,
        type: file.type
      };
      filesResponse.push(fileResponse);
    }

    const commentResponses: CommentResponseDTO[] = [];

    const comments = await Comment.find({ _id: { $in: post.comments } });
    for (const comment of comments) {
      const commentResponse: CommentResponseDTO = await getAComment(
        comment._id
      );
      commentResponses.push(commentResponse);
    }

    const tags: ShortUserResponseDTO[] = [];
    const tagUsers = await User.find({ _id: { $in: post.tagIds } });
    for (const user of tagUsers) {
      const tag: ShortUserResponseDTO = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar
      };
      tags.push(tag);
    }

    const postResponse: PostResponseDTO = {
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
      musicImageURL: post.musicImageURL
    };

    for (const c of postResponse.comments) {
      console.log("replys: " + c.replieds);
    }
    return postResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getSingleIdPosts = async (userId: string) => {
  try {
    connectToDatabase();
    if (!userId) {
      throw new Error("You ara unauthenticated!");
    }
    const user = await User.findById(userId);
    const posts = await Post.find({ userId: userId });
    if (posts.length == 0) {
      return false;
    }
    const postsResponse: PostResponseDTO[] = [];
    for (const post of posts) {
      const fileOfPost = await File.find({
        _id: { $in: post.contentIds }
      }).exec();
      const filesResponse: FileResponseDTO[] = [];
      for (const file of fileOfPost) {
        const fileResponse: FileResponseDTO = {
          _id: file._id,
          url: file.url,
          fileName: file.fileName,
          width: file.width,
          height: file.height,
          format: file.format,
          bytes: file.bytes,
          type: file.type
        };
        filesResponse.push(fileResponse);
      }

      const commentResponses: CommentResponseDTO[] = [];

      const comments = await Comment.find({ _id: { $in: post.comments } });
      for (const comment of comments) {
        const commentResponse: CommentResponseDTO = await getAComment(
          comment._id
        );
        commentResponses.push(commentResponse);
      }

      const tags: ShortUserResponseDTO[] = [];
      const tagUsers = await User.find({ _id: { $in: post.tagIds } });
      for (const user of tagUsers) {
        const tag: ShortUserResponseDTO = {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          nickName: user.nickName,
          avatar: user.avatar
        };
        tags.push(tag);
      }

      const postResponse: PostResponseDTO = {
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
        musicImageURL: post.musicImageURL
      };
      postsResponse.push(postResponse);
    }
    return postsResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getManagePosts = async (userId: string) => {
  try {
    connectToDatabase();
    if (!userId) {
      throw new Error("You ara unauthenticated!");
    }
    const user = await User.findById(userId);

    const posts = await Post.find({ userId: userId });
    if (posts.length == 0) {
      return [];
    }
    const postsResponse: PostResponseManageDTO[] = [];
    for (const post of posts) {
      const fileOfPost = await File.find({
        _id: { $in: post.contentIds }
      }).exec();
      const filesResponse: FileResponseDTO[] = [];
      for (const file of fileOfPost) {
        const fileResponse: FileResponseDTO = {
          _id: file._id,
          url: file.url,
          fileName: file.fileName,
          width: file.width,
          height: file.height,
          format: file.format,
          bytes: file.bytes,
          type: file.type
        };
        filesResponse.push(fileResponse);
      }

      const commentResponses: CommentResponseDTO[] = [];

      const comments = await Comment.find({ _id: { $in: post.comments } });
      for (const comment of comments) {
        const commentResponse: CommentResponseDTO = await getAComment(
          comment._id
        );
        commentResponses.push(commentResponse);
      }

      const postResponse: PostResponseManageDTO = {
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
        flag: post.flag
      };
      postsResponse.push(postResponse);
    }
    return postsResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getFriendPosts = async (
  friendId: string,
  userId: Schema.Types.ObjectId
) => {
  try {
    connectToDatabase();
    await findPairUser(friendId, userId.toString());
    const [stUserId, ndUserId] = [friendId, userId.toString()].sort();
    const relation = await Relation.findOne({
      stUser: stUserId,
      ndUser: ndUserId,
      relation: "bff",
      status: true
    });
    if (!relation) {
      return false;
    }

    const posts = await getSingleIdPosts(friendId);

    return posts;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createPost = async (param: CreatePostDTO) => {
  try {
    connectToDatabase();
    const postData = Object.assign(param, {
      createBy: param.userId ? param.userId : new mongoose.Types.ObjectId(),
      flag: true
    });
    const createdPost = await Post.create(postData);
    return createdPost;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const addPost = async (
  filesToUpload: formidable.File[],
  caption: string[] | undefined,
  userId: Schema.Types.ObjectId | undefined,
  tagIds: string[],
  musicName: string,
  musicURL: string,
  musicAuthor: string,
  musicImageURL: string
) => {
  try {
    const contendIds: Schema.Types.ObjectId[] = [];
    if (filesToUpload.length != 0) {
      for (const file of filesToUpload) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        const createdFile = await createFile(file, userId?.toString()!);
        contendIds.push(createdFile._id);
      }

      if (contendIds.length == 0) {
        throw new Error("Creating file failed!");
      }
    }

    const tags = await User.find({ _id: { $in: tagIds } });

    const tagObjectIds = tags.map((tag) => tag._id);

    const postData: CreatePostDTO = {
      userId: userId,
      caption: caption ? caption.toString() : "",
      contentIds: contendIds,
      tagIds: tagObjectIds,
      musicName: musicName,
      musicURL: musicURL,
      musicAuthor: musicAuthor,
      musicImageURL: musicImageURL
    };
    const postDataToCreate = await Object.assign(postData, {
      createBy: userId
    });
    const createdPost = await Post.create(postDataToCreate);

    const user = await User.findById(userId);
    console.log(createdPost);
    await user.postIds.addToSet(createdPost._id);

    await user.save();

    return createPost;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const deletePost = async (
  postId: string,
  userId: Schema.Types.ObjectId
) => {
  try {
    connectToDatabase();
    const post = await Post.findById(postId);
    if (post.userId != userId.toString()) {
      console.log("You are unauthenticated!");
    }

    await Post.findByIdAndDelete(postId);

    return { message: `Delete post ${postId} successfully!` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const hiddenPost = async (postId: string) => {
  try {
    connectToDatabase();
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    post.flag = false;

    await post.save();

    return { message: `Hide ${postId} successfully!` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const displayPost = async (postId: string) => {
  try {
    connectToDatabase();
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    post.flag = true;

    await post.save();

    return { message: `Display ${postId} successfully!` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const editPost = async (
  id: string,
  userId: Schema.Types.ObjectId | undefined,
  editContent: EditPostDTO
) => {
  try {
    console.log("Edit content: ", editContent);
    const post = await Post.findById(id);
    const users = await User.find({ _id: { $in: editContent.tagIds } });
    const tagObjectIds = users.filter((item) => item._id);
    if (!post) {
      return { message: "Post not exist!" };
    }
    if (post.createBy.toString() != userId?.toString()) {
      return { message: "You cannot edit this post!" };
    }
    const contentIds = post.contentIds.map((item: Schema.Types.ObjectId) =>
      item.toString()
    );
    const deleteFileIds = _.difference(
      contentIds,
      editContent.remainContentIds
    );
    for (const id of deleteFileIds) {
      await File.findByIdAndDelete(id);
      post.contentIds.filter(
        (item: Schema.Types.ObjectId) => item.toString() != id.toString()
      );
    }
    const createdFileIds: string[] = [];
    for (const file of editContent.contents) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const createdFile = await createFile(file, userId?.toString()!);
      createdFileIds.push(createdFile._id);
    }
    post.caption = editContent.caption;
    post.contentIds.push(...createdFileIds);
    post.tagIds = tagObjectIds;
    post.musicName = editContent.musicName;
    post.musicURL = editContent.musicURL;
    post.musicAuthor = editContent.musicAuthor;
    post.musicImageURL = editContent.musicImageURL;
    await post.save();

    return await getAPost(post._id, userId!);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAllPostsToCheck = async () => {
  try {
    await connectToDatabase();
    const allPosts = await Post.find().populate("contentIds createBy");

    const responsePost: CheckedPostReponse[] = allPosts.map((item) => ({
      _id: item._id.toString(),
      flag: item.flag,
      firstName: item?.createBy?.firstName || "",
      lastName: item?.createBy?.lastName || "",
      userId: item?.userId.toString() || "",
      likedIds: item.likedIds?.length || 0,
      shares: item.shares?.length || 0,
      comments: item.comments?.length || 0,
      caption: item.caption || "",
      createAt: item.createAt,
      contents: item.contentId || [] // nếu populate contentId là một mảng hoặc object
    }));

    return responsePost;
  } catch (error) {
    console.error("Error fetching all posts: ", error);
    throw error;
  }
};
