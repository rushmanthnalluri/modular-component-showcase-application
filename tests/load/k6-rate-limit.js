import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 1,
  iterations: 20,
};

const gatewayBase = __ENV.GATEWAY_URL || "http://localhost:8000";

export default function () {
  const response = http.get(`${gatewayBase}/health`);
  check(response, {
    "gateway responds with success or rate limit": (r) => [200, 429].includes(r.status),
  });
}
