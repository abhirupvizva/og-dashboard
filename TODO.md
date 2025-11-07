
# TODO: Optimize Interview Filtering and Loading

## 1. Update API for Pagination and Optimization ✅
- Add `page` and `limit` query params to `/api/interviews` (default limit 100).
- Implement pagination in MongoDB query using `skip` and `limit`.
- Convert date strings to ISO format for efficient range queries.
- Return total count for pagination info.

## 2. Update Frontend for Pagination ✅
- Modify `app/page.tsx` to handle pagination state (current page, total pages).
- Add "Load More" button to fetch next page.
- Accumulate interviews in state instead of replacing.
- Update fetchInterviews to append new data.

## 3. Improve Loading and Feedback UI ✅
- Add a loading spinner component in `app/page.tsx`.
- Show loading state during API calls.
- Ensure feedback column in `components/interview-table.tsx` displays correctly (show "N/A" if empty, or dialog if present).

## 4. Testing and Followup ✅
- Test API with pagination for speed.
- Verify filtering works with pagination.
- Add DB indexes on queried fields (Date of Interview, assignedTo, status, etc.) - note to user.
- Confirm loading is fast and feedback shows properly.
