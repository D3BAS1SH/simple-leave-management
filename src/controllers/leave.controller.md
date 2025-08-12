# Leave Controller Documentation

This document describes the API endpoints and logic implemented in `leave.controller.ts` for managing employee leave requests in the Simple Leave Management system.

## Endpoints & Functions

### 1. Apply for Leave
- **Function:** `applyForLeave`
- **Route:** `POST /api/leaves`
- **Description:** Allows an employee to apply for leave.
- **Request Body:**
  - `employeeId` (string, required)
  - `startDate` (string, required, ISO format)
  - `endDate` (string, required, ISO format)
- **Validation & Logic:**
  - Checks all fields are present.
  - Validates that start date is not after end date and not in the past.
  - Ensures the employee exists and the leave is not before their joining date.
  - Checks for overlapping leave requests (pending/approved) for the same employee.
  - Verifies the employee has enough leave balance.
  - If all checks pass, creates a new leave request with status `Pending`.
- **Response:**
  - `201 Created` with leave request data on success.
  - Appropriate error status and message on failure.

### 2. Update Leave Status (Approve/Reject)
- **Function:** `updateLeaveStatus`
- **Route:** `PATCH /api/leaves/:id`
- **Description:** Allows HR to approve or reject a leave request.
- **Request Params:**
  - `id` (string, leave request ID)
- **Request Body:**
  - `status` (string, required: `Approved` or `Rejected`)
- **Validation & Logic:**
  - Validates the status value.
  - Ensures the leave request exists and is still pending.
  - If approving, checks the employee still has enough leave balance and deducts the days.
  - Updates the leave status and saves changes.
- **Response:**
  - `200 OK` with updated leave data on success.
  - Appropriate error status and message on failure.

### 3. Get Pending Leaves
- **Function:** `getPendingLeaves`
- **Route:** `GET /api/leaves/pending`
- **Description:** Retrieves a paginated list of all pending leave requests.
- **Query Params:**
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 9)
- **Response:**
  - `200 OK` with paginated pending leave data and metadata.

### 4. Get All Leaves
- **Function:** `getAllLeaves`
- **Route:** `GET /api/leaves`
- **Description:** Retrieves a paginated list of all leave requests.
- **Query Params:**
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 9)
- **Response:**
  - `200 OK` with paginated leave data and metadata.

## Notes
- All functions use async error handling middleware (`asyncHandler`).
- Employee and Leave models are used for database operations.
- Pagination is implemented for list endpoints.
- Proper HTTP status codes and error messages are returned for all error cases.

---

For further details, refer to the inline comments in `src/controllers/leave.controller.ts`.
