// src/utils/axios.util.ts
import axios, { AxiosRequestConfig, Method } from 'axios';

export async function httpRequest<T = any>(
  method: Method,
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await axios({
      method,
      url,
      data,
      ...config,
    });

    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data || error.message;

    throw new Error(
      `[HTTP ERROR] ${method.toUpperCase()} ${url} -> ${status} | ${JSON.stringify(
        message,
      )}`,
    );
  }
}
