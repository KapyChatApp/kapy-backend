import Report from "@/database/report.model";
import {
  CreateReportDTO,
  ReportResponseDTO,
  ReportResponseManageDTO,
  UpdateReportDTO,
  VerifyReportDTO
} from "@/dtos/ReportDTO";
import { Schema } from "mongoose";
import { connectToDatabase } from "../mongoose";
import { ShortUserResponseDTO } from "@/dtos/UserDTO";

export async function allReport() {
  try {
    connectToDatabase();
    const reportResponses: ReportResponseManageDTO[] = [];

    const reports = await Report.find().populate("createBy");

    for (const report of reports) {
      await report.populateTarget();
      const createByInfo: ShortUserResponseDTO = {
        _id: report.createBy._id,
        firstName: report.createBy.firstName,
        lastName: report.createBy.lastName,
        nickName: report.createBy.nickName,
        avatar: report.createBy.avatar
      };
      const reportResponse: ReportResponseManageDTO = {
        _id: report._id,
        content: report.content,
        flag: report.flag,
        status: report.status,
        userId: createByInfo,
        target: report.target,
        targetType: report.targetType,
        createAt: report.createAt
      };
      reportResponses.push(reportResponse);
    }

    return reportResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createReport(
  param: CreateReportDTO,
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();
    const existReport = await Report.findOne({
      createBy: userId,
      targetId: param.targetId
    });

    if (existReport) {
      return { message: "You have reported it!" };
    }

    const reportData = await Object.assign(param, { createBy: userId });
    const report = await Report.create(reportData);

    await report.populateTarget();

    const reportResponse: ReportResponseDTO = {
      _id: report._id,
      content: report.content,
      flag: report.flag,
      status: report.status,
      userId: report.userId,
      target: report.target
    };

    return reportResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function updateReport(
  param: UpdateReportDTO,
  reportId: string | undefined,
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();
    const report = await Report.findById(reportId);

    if (!report) {
      return { message: "This report not exist!" };
    }

    if (report.createBy != userId) {
      return { message: "You cannot edit this report!" };
    }

    if (!report.status) {
      return { message: "This report has been closed!" };
    }

    const updatedReport = await Report.updateMany({ _id: reportId }, param);

    return updatedReport;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function myReports(userId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const reportResponses: ReportResponseDTO[] = [];
    const reports = await Report.find({ createBy: userId });

    for (const report of reports) {
      await report.populateTarget();
      const reportResponse: ReportResponseDTO = {
        _id: report._id,
        content: report.content,
        userId: report.userId,
        flag: report.flag,
        status: report.status,
        target: report.target
      };
      reportResponses.push(reportResponse);
    }
    return reportResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteReport(
  reportId: string,
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      return { message: "This report not exist!" };
    }
    if (!userId) {
      return { message: "You are unauthenticated!" };
    }
    if (report.createBy != userId.toString()) {
      return { message: "You cannot delete this report" };
    }
    if (!report.status) {
      return { message: "This report has been closed!" };
    }
    await Report.findOneAndDelete({ _id: reportId });

    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function removeReport(reportId: string) {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      return { message: "This report not exist!" };
    }
    if (!report.status) {
      return { message: "This report has been closed!" };
    }
    await Report.findOneAndDelete({ _id: reportId });

    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function verifyReport(
  param: VerifyReportDTO,
  reportId: string | undefined
) {
  try {
    await Report.findOneAndUpdate({ _id: reportId }, param);
    return { message: "Updated successfully!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
