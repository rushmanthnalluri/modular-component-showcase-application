import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<1200"],
    http_req_failed: ["rate<0.05"],
  },
};

const backendBase = __ENV.BACKEND_URL || "http://localhost:5000";
const gatewayBase = __ENV.GATEWAY_URL || "http://localhost:8000";

export default function () {
  const backendHealth = http.get(`${backendBase}/health`);
  check(backendHealth, {
    "backend health is 200": (r) => r.status === 200,
  });

  const gatewayHealth = http.get(`${gatewayBase}/health`);
  check(gatewayHealth, {
    "gateway health is 200": (r) => r.status === 200,
  });

  sleep(1);
}
