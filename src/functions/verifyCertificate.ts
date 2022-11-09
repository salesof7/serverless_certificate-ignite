import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodbClient";

interface IRequest {
  id?: string;
}

interface IUserCertificate {
  id: string;
  name: string;
  created_at: string;
  grade: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id } = event.pathParameters as IRequest;

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
        message: "Unable to find certificate!",
      }),
    };
  }

  const userCertificate = response.Items[0] as IUserCertificate;

  if (userCertificate !== null && id !== undefined) {
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Valid Certificate",
        name: userCertificate.name,
        url: `https://www.ignite-serverless-certificate.s3.amazonaws.com/${id}.pdf`,
      }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Invalid Certificate",
    }),
  };
};
