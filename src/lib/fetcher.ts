"use server";

import { z } from "zod";

const methodSchema = z.enum(['GET', "POST", 'PUT', 'OPTION', 'DELETE']).default("GET");

type MethodType = z.infer<typeof methodSchema>;

type BaseRequestParamType = {
  url: string;
  method: MethodType,
  body?: BodyInit,
  headers?: HeadersInit,
};


const CLOUDFLARE_API_URL = process.env.CLOUDFLARE_API_URL || "";
const CLOUDFLARE_AUTH_MAIL = process.env.CLOUDFLARE_AUTH_MAIL || "";
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY || "";

const cloudFlareBaseRequest = async <T> ({url, method = "GET", body, headers}:BaseRequestParamType) => {
  const request_url = `${CLOUDFLARE_API_URL}${url}`;
  const option: {method: MethodType;body?: BodyInit; headers?: HeadersInit } = {
    method,
    headers: {
      'X-Auth-Email': CLOUDFLARE_AUTH_MAIL,
      "X-Auth-Key": CLOUDFLARE_API_KEY,
      ...headers
    }
  };
  if(method === "POST" || method === "PUT"){
    option.headers = {
      ...option.headers,
      'Content-Type': 'application/json'
    }
    option.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(request_url, option);
    const result = (response.json()) as T;

    return result;
  } catch (error) {
    console.error(error);
    throw new Error("Request error");
  }
}

export const getAPI = async <T> (url: string, params?: any) => {
  let queryString = "";
  if(params){
    queryString = new URLSearchParams(params).toString();
  }
  return cloudFlareBaseRequest<T>({url: `${url}${params ? `?${queryString}`: ""}`, method:"GET"});
}

export const postAPI = async <T>(url: string, body: any) => {
  const headers: HeadersInit = {
    'Content-Type': "application/json",
  }
  return cloudFlareBaseRequest<T>({url, method:"POST", headers, body});
}