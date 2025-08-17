export class ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;

    constructor(statusCode: number, message: string, data: T) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}

export class ApiError {
    statusCode: number;
    message: string;
    stack?: string;

    constructor(statusCode: number, message: string, stack?: string) {
        this.statusCode = statusCode;
        this.message = message;
        this.stack = stack;
    }
}
