import Relation from "@/database/relation.model";

export const getRelationFromTo = async (stUserId: string, ndUserId: string) => {
  try {
    const [stUser,ndUser] = [stUserId, ndUserId].sort();
    const relationRecords = await Relation.find({
      stUser: stUser,
      ndUser: ndUser,
    });
    for(const relation of relationRecords){
        if(relation.relation==="block") return "block";
    }
    const pendingRelations = relationRecords.filter(
      (item) => item.status === false
    );
    const relations = relationRecords.filter((item) => item.status === true);
    if (pendingRelations.length == 0) {
      let relationResponse = "stranger";
      for (const relation of relations) {
        console.log("relation: ",relation);
        if (relation.relation === "bff") {
          return "bff";
        }
        if (relation.relation === "friend") {
          relationResponse = "friend";
        }
      }
      return relationResponse;
    } else {
      let relationResponse = "stranger";
      for (const relation of pendingRelations) {
        if (relation.relation === "bff") {
          relationResponse =
            relation.sender.toString() === stUserId
              ? "sent_bff"
              : "received_bff";
        } else {
          relationResponse = relation.sender.toString() ===stUserId? "sent_friend":"received_friend"
        }
      }
      return relationResponse;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
