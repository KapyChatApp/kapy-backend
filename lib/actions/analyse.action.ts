import AuthHistory from "@/database/auth-history.model";
import Message from "@/database/message.model";
import User from "@/database/user.model";
import { CountAnalyseResponseDTO } from "@/dtos/AnalyseDTO";

export async function countTotalSystems() {
  try {
    const totalMobile = (
      await AuthHistory.countDocuments({
        deviceType: "PHONE",
        isActive: true,
      })
    ).toString();
    const totalBrowser = (
      await AuthHistory.countDocuments({
        deviceType: "DESKTOP",
      })
    ).toString();
    const totalMessage = (await Message.countDocuments()).toString();
    const totalUser = (await User.countDocuments()).toString();
    const totalMale = (await User.countDocuments({ gender: true })).toString();
    const totalFemale = (
      await User.countDocuments({ gender: false })
    ).toString();
    const today = new Date();
    const lt18 = (await User.countDocuments({
      birthday: {
        $gt: new Date(
          today.getFullYear() - 18,
          today.getMonth(),
          today.getDate()
        ),
      },
    })).toString();
    const gte18lte50 = (
      await User.countDocuments({
        birthday: {
          $lte: new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
          ),
          $gt: new Date(
            today.getFullYear() - 50,
            today.getMonth(),
            today.getDate()
          ),
        },
      })
    ).toString();
    const gt50 = (
      await User.countDocuments({
        birthday: {
          $lte: new Date(
            today.getFullYear() - 50,
            today.getMonth(),
            today.getDate()
          ),
        },
      })
    ).toString();
    const result: CountAnalyseResponseDTO = {
      authHistory: {
        totalPhone: totalMobile,
        totalBrowser: totalBrowser,
      },
      message: {
        totalMessage: totalMessage,
      },
      user: {
        totalUser: totalUser,
        gender: {
          male: totalMale,
          female: totalFemale,
        },
        age: {
          lt18: lt18,
          gte18lte50: gte18lte50,
          gt50: gt50,
        },
      },
    };
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
