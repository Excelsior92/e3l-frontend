import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

const useApi = () => {
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(null);

  const makeRequest = useCallback((type, endpoint, params = null, headers = {}, requestId = null) => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      setError(null);
      setStatusCode(null);
      setResponse(null);

      const authToken = localStorage.getItem('authToken');
      const source = axios.CancelToken.source();

      const config = {
        cancelToken: source.token,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...(requestId && { 'X-Request-Id': requestId }),
          ...headers,
        },
      };

      let request;
      const fullUrl = `${API_URL}${endpoint}`;
      console.log('🌐 Final API URL:', fullUrl);

      if (type === 'get') {
        request = axios.get(fullUrl, { params, ...config });
      } else if (type === 'post') {
        request = axios.post(fullUrl, params, config);
      } else if (type === 'put') {
        request = axios.put(fullUrl, params, config);
      } else if (type === 'delete') {
        request = axios.delete(fullUrl, { data: params, ...config });
      } else {
        setIsLoading(false);
        reject(new Error('Invalid API call type'));
        return;
      }

      request
        .then((res) => {
          setResponse(res);
          setIsLoading(false);
          setStatusCode(res.status);
          resolve(res.data);
        })
        .catch((err) => {
          if (axios.isCancel(err)) return;
          const errorMessage = err.response
            ? `Server Error (${err.response.status}): ${err.response.data?.error || 'Something went wrong.'}`
            : 'Cannot reach the server. Please check if the backend services are running.';
          setError(errorMessage);
          setStatusCode(err.response?.status || null);
          setIsLoading(false);
          toast.error(errorMessage);
          reject(errorMessage);
        });

      return () => source.cancel('Request canceled');
    });
  }, []);

  return [response, isLoading, error, makeRequest, statusCode];
};

export default useApi;