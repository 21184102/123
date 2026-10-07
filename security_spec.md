# Security Specification: Cloud & Offline Todo

## 1. Data Invariants
1. **User Data Isolation & Zero Privacy Leakage**: Each task document resides under `/users/{userId}/tasks/{taskId}`.
2. **Strict Identity Binding**: Read, create, update, and delete are permitted exclusively if `request.auth.uid == userId`.
3. **No Cross-User Access**: User A can never query, read, update, or delete User B's tasks under any circumstances.
4. **Data Integrity**: Every created task must contain required fields: `id`, `userId`, `title`, `completed`, `createdAt`, `updatedAt`.
5. **No Shadow Fields**: Keys are strictly validated. Extra unexpected properties are rejected.
6. **Immutable Ownership**: `userId` and `id` cannot be altered upon update.
7. **Size Bounds**: `title` must be string between 1 and 500 chars; `description` <= 2000 chars; `category` <= 50 chars.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read**: Attempting to read `/users/user123/tasks` without login. (Expected: DENIED)
2. **Cross-User Snooping**: Authenticated user `userA` attempting to read `/users/userB/tasks/task1`. (Expected: DENIED)
3. **Cross-User List**: Authenticated user `userA` attempting to list `/users/userB/tasks`. (Expected: DENIED)
4. **Cross-User Spoofed Task Creation**: `userA` attempting to write a task under `/users/userB/tasks/task1`. (Expected: DENIED)
5. **Mismatching userId in Payload**: `userA` writing to `/users/userA/tasks/task1` with `incoming().userId == 'userB'`. (Expected: DENIED)
6. **Missing Required Fields**: Creating task with no `title` or `completed` field. (Expected: DENIED)
7. **Oversized Field Payload**: Sending task with title > 500 characters or description > 2000 characters. (Expected: DENIED)
8. **Invalid Enum in Priority**: Setting priority to `'urgent'` or `'critical'` instead of `'low'|'medium'|'high'`. (Expected: DENIED)
9. **Ownership Mutation Attack**: Updating task to change `userId` from `userA` to `userB`. (Expected: DENIED)
10. **ID Path Hijacking**: Setting document ID with malicious characters or length > 128 chars. (Expected: DENIED)
11. **Profile Data Snooping**: `userA` attempting to read `/users/userB/profile/info`. (Expected: DENIED)
12. **Catch-All Infiltration**: Attempting to read or write to arbitrary root collections like `/admin`, `/system`, etc. (Expected: DENIED)
