export interface WithTimeoutOptions {
  taskName?: string;
  onError?: (error: any) => void | Promise<void>;
}

export const withTimeout = async <T>(fn: () => Promise<T>,
  timeoutInMs: number, options: WithTimeoutOptions = {}): Promise<T> => {
  try {
    const res = await Promise
      .race([fn(), timeout<T>(timeoutInMs, options.taskName)]);

    return res;
  } catch (error) {
    console.error(error);
    if (options.onError) await options.onError(error);
    throw error;
  }
};

function timeout<T>(ms: number, taskName: string = 'Asynchronous function'): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${taskName} timed out after ${ms}ms.`));
    }, ms);
  });
}
