import { gatewayRequest } from "@/services/apiClient";

export async function fetchSpringUsers() {
  return gatewayRequest("/springservice/users");
}

export async function fetchSpringComponents() {
  return gatewayRequest("/springservice/components");
}

export async function fetchSpringReviews() {
  return gatewayRequest("/springservice/reviews");
}

export async function fetchSpringHealth() {
  return gatewayRequest("/springservice/health");
}
