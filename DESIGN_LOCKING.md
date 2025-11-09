# Design Locking Mechanism

## Overview
The design locking mechanism prevents concurrent editing conflicts by ensuring only one user can edit a design at a time. Users must acquire a lock before making changes, and the lock is automatically managed to balance collaboration and data integrity.

## Features

### User Experience
1. **Enable Editing Button**: Click to acquire an edit lock on the design
2. **Lock Status Indicator**: Visual feedback showing lock ownership and status
3. **Read-Only Mode**: When locked by another user, the design is view-only
4. **Smart Unlock**: Auto-saves changes and refreshes design data on unlock
5. **Lock Timeout**: Locks expire after 30 minutes of inactivity

### Backend Implementation

#### API Endpoints

**Lock Design** - `/api/ExecLockDesign`
- **Method**: POST
- **Body**: `{ jobId: string }`
- **Response**: Lock status with owner and expiry information
- **Behavior**:
  - Acquires a 30-minute lock if design is unlocked
  - Refreshes lock if user already owns it
  - Returns 409 Conflict if another user has the lock

**Unlock Design** - `/api/ExecUnlockDesign`
- **Method**: POST
- **Body**: `{ jobId: string, force?: boolean }`
- **Response**: Success or error
- **Behavior**:
  - Releases the lock if owned by the user
  - `force` flag allows admin override (not currently exposed in UI)
  - Frontend automatically refreshes design data after unlock

**Check Lock Status** - `/api/ExecCheckDesignLock`
- **Method**: GET
- **Query**: `jobId=string`
- **Response**: Current lock status and ownership
- **Behavior**:
  - Returns lock information if active
  - Auto-removes expired locks
  - Polled every 10 seconds by frontend

**Save Design** - `/api/ExecSaveDesign`
- **Modified Behavior**: 
  - Validates lock ownership before saving
  - Returns 403 Forbidden if design is locked by another user

#### Database Schema

**DesignLocks Table**
```
PartitionKey: JobId (string)
RowKey: JobId (string)
LockedBy: Username (string)
LockedAt: ISO timestamp (string)
ExpiresAt: ISO timestamp (string)
LastRefreshed: ISO timestamp (string)
```

### Frontend Implementation

#### useDesignLock Hook
Located at: `/src/hooks/useDesignLock.js`

**Features**:
- Auto-checks lock status every 10 seconds
- Auto-refreshes owned locks every 5 minutes
- Provides lock/unlock operations
- Refreshes design data on unlock

**Usage**:
```javascript
const {
  isLocked,      // Boolean: Is design currently locked?
  isOwner,       // Boolean: Does current user own the lock?
  lockInfo,      // Object: Lock details (LockedBy, ExpiresAt, etc.)
  lockDesign,    // Function: Acquire lock
  unlockDesign,  // Function: Release lock
} = useDesignLock(jobId);
```

#### DesignLockButton Component
Located at: `/src/components/designer/DesignLockButton.jsx`

**States**:
1. **Unlocked**: Shows "Enable Editing" button
2. **Owned**: Shows green "Unlock Design" button
3. **Locked by Other**: Shows red "Locked" button (disabled)

**Dialog**:
- Unlock confirmation for lock owners
- Lock info display for non-owners

#### Read-Only Mode
When `isLocked && !isOwner`:
- Visual banner at top of designer
- All editing operations disabled (drag, select, transform)
- Save button disabled
- Product/connector/text interactions blocked

## Lock Lifecycle

### Acquiring a Lock
1. User clicks "Enable Editing" button
2. Frontend calls `/api/ExecLockDesign`
3. If successful:
   - Lock stored in DesignLocks table
   - Auto-refresh interval starts (every 5 minutes)
   - Design data refreshed to ensure latest version
   - Edit mode enabled

### Lock Maintenance
- Every 5 minutes: Frontend calls `/api/ExecLockDesign` to refresh timeout
- Every 10 seconds: Frontend checks lock status via `/api/ExecCheckDesignLock`
- Lock timeout: 30 minutes from last refresh

### Releasing a Lock
1. User clicks "Unlock Design" button
2. Frontend auto-saves any pending changes
3. Frontend calls `/api/ExecUnlockDesign`
4. Lock removed from DesignLocks table
5. Design data refreshed to show latest saved version
6. Auto-refresh interval cleared

### Lock Expiry
- Locks automatically expire after 30 minutes
- Expired locks are removed when checked via `/api/ExecCheckDesignLock`
- User can re-acquire expired lock by clicking "Enable Editing"

## Conflict Resolution

### Concurrent Lock Attempts
If User A has a lock and User B tries to acquire it:
1. User B clicks "Enable Editing"
2. API returns 409 Conflict with lock owner info
3. UI shows dialog: "Design Locked by User A"
4. User B must wait for lock to expire or be released

### Stale Locks
If a user's browser crashes or loses connection:
- Lock expires after 30 minutes
- Other users can then acquire the lock
- Original user sees "Locked by..." message if they return

### Save Conflicts
If somehow a user without a lock tries to save:
- API validates lock ownership
- Returns 403 Forbidden
- Frontend shows error message
- User must acquire lock first

## Best Practices

### For Users
1. **Lock Early**: Click "Enable Editing" before making changes
2. **Unlock When Done**: Release the lock so others can edit
3. **Auto-Save**: Design auto-saves while locked, but manual save is available
4. **Communication**: If you see a lock, contact the owner if needed

### For Administrators
1. **Monitor Locks**: Check DesignLocks table for stuck locks
2. **Force Unlock**: Use API with `force: true` flag if needed (not in UI)
3. **Adjust Timeout**: Modify lock timeout in API if 30 minutes is too long/short

## Future Enhancements

Potential improvements:
1. Real-time notifications when lock status changes
2. Lock queue system for multiple waiting users
3. Granular locking (layer-level instead of design-level)
4. Lock history/audit trail
5. Admin UI for force-unlocking designs
6. Configurable lock timeout per user or organization
