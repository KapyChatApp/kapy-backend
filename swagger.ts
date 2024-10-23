import { generateOpenApi } from "@ts-rest/open-api";
import { Contract } from "./contract/Contract";
export const OpenAPIV1 = generateOpenApi(Contract, {
  info: {
    title: "Kapy ChatApp API V1",
    version: "1.0.0",
    description: "",
  },
});
