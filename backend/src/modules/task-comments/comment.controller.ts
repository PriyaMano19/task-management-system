import {
  Request,
  Response,
  NextFunction,
} from "express";

import { commentService } from "./comment.service";
import { getParam } from "../../shared/utils/getParam";


// ============================================================
// CREATE COMMENT
// ============================================================

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const comment =
      await commentService.createComment(
        projectId,
        folderId,
        taskId,
        req.user.id,
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      data: comment,
    });

  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET COMMENTS
// ============================================================

export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const comments =
      await commentService.getComments(
        projectId,
        folderId,
        taskId,
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: "Comments retrieved successfully.",
      data: comments,
    });

  } catch (error) {
    next(error);
  }
};


// ============================================================
// UPDATE COMMENT
// ============================================================

export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const commentId =
      getParam(req.params.commentId);

    const comment =
      await commentService.updateComment(
        projectId,
        folderId,
        taskId,
        commentId,
        req.user.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      data: comment,
    });

  } catch (error) {
    next(error);
  }
};


// ============================================================
// DELETE COMMENT
// ============================================================

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const commentId =
      getParam(req.params.commentId);

    await commentService.deleteComment(
      projectId,
      folderId,
      taskId,
      commentId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};