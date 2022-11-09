import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodbClient";
import { compile } from "handlebars";
import { join } from "path";
import { readFileSync } from "fs";
import * as dayjs from "dayjs";

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

interface ITemplate {
  id: string;
  name: string;
  grade: string;
  medal: string;
  date: string;
}

const compileTemplate = async (data: ITemplate): Promise<string> => {
  const filePath = join(process.cwd(), "src", "templates", "certificates.hbs");

  const html = readFileSync(filePath, "utf-8");

  return compile(html)(data);
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.body === null) {
    throw new Error("Event body is null");
  }

  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

  await document
    .put({
      TableName: "users_certificate",
      Item: {
        id,
        name,
        grade,
        created_at: new Date().getTime(),
      },
    })
    .promise();

  const response = await document
    .query({
      TableName: "users_certificate",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
    })
    .promise();

  if (response.Items === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Unable to create certificate!",
      }),
    };
  }

  const medalPath = join(process.cwd(), "src", "templates", "selo.png");
  const medal = readFileSync(medalPath, "base64");

  const data: ITemplate = {
    name,
    id,
    grade,
    date: dayjs().format("DD/MM/YYYY"),
    medal,
  };

  const content = await compileTemplate(data);
  console.log(content);

  return {
    statusCode: 201,
    body: JSON.stringify(response.Items[0]),
  };
};
