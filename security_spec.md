# Firebase Security Specification - FollowPlus

This document outlines the security invariants, malicious payloads, and rules definition for the FollowPlus Firestore store.

## 1. Safety Invariants

1. **Campaign Creation Integrity**: A user can create a campaign. It must have all required fields (`id`, `username`, `type`, `status`, `targetAmount`, `deliveredAmount`, `startDate`, `createdAt`).
2. **Campaign Deletion**: Only authorized admin actions or the creator (if authenticated) can delete any campaign document.
3. **No Ransomware Injection**: Document IDs must be validated (`isValidId(campaignId)`). Let's prevent injection of huge characters.
4. **String and Array Limits**: All text strings (such as `username`, `password`, `isVerified`) must be bounded to reasonable size limits to prevent Denial of Wallet attacks.
5. **Timestamp Immutable Guard**: `createdAt` remains immutable once set and matches `request.time`.

## 2. The Dirty Dozen Payloads

Below are the 12 attack payloads that MUST result in a `PERMISSION_DENIED`:

### P1: Identity Spoofing (Modifying `id` to match another campaign)
```json
{
  "id": "campaign-malicious",
  "username": "legit_user",
  "password": "legit_password",
  "type": "free_followers_trial",
  "status": "active",
  "targetAmount": 1000000, 
  "deliveredAmount": 0,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600
}
```

### P2: State Shortcutting (Setting state directly to `'completed'` on creation)
```json
{
  "id": "campaign-2",
  "username": "hacker",
  "status": "completed",
  "type": "likes",
  "targetAmount": 10000,
  "deliveredAmount": 10000,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600
}
```

### P3: Missing Critical Key (`deliveredAmount` not set)
```json
{
  "id": "campaign-3",
  "username": "hacker",
  "type": "likes",
  "status": "active",
  "targetAmount": 1000,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600
}
```

### P4: Enormous Payload Attack (1MB password field)
```json
{
  "id": "campaign-4",
  "username": "hacker",
  "password": "[Enormous 1MB String...]",
  "type": "likes",
  "status": "active",
  "targetAmount": 1000,
  "deliveredAmount": 0,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600
}
```

### P5: Invalid Enum Type For `type` Field
```json
{
  "id": "campaign-5",
  "username": "hacker",
  "type": "super_mega_followers_deluxe",
  "status": "active",
  "targetAmount": 1000,
  "deliveredAmount": 0,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600
}
```

### P6: Negative Target Amount Attack
```json
{
  "id": "campaign-6",
  "username": "hacker",
  "type": "likes",
  "status": "active",
  "targetAmount": -500,
  "deliveredAmount": 0,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600
}
```

### P7: Delivered Amount Greater Than Target Amount on Creation
```json
{
  "id": "campaign-7",
  "username": "hacker",
  "type": "followers",
  "status": "active",
  "targetAmount": 500,
  "deliveredAmount": 99999,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600
}
```

### P8: Path ID Poisoning (Junk characters in document ID url)
`POST /campaigns/campaign_id_with_$_junk%23_chars`

### P9: Shadow Fields Insertion (`isVipUser` custom entry)
```json
{
  "id": "campaign-9",
  "username": "hacker",
  "type": "likes",
  "status": "active",
  "targetAmount": 500,
  "deliveredAmount": 0,
  "startDate": "2026-05-26T12:00:00.000Z",
  "createdAt": 1782345600,
  "isVipUser": true
}
```

### P10: Modifying Immutable `createdAt` Field on Update
`PATCH /campaigns/campaign-legit`
```json
{
  "createdAt": 1600000000
}
```

### P11: Status Update Bypass (Unauthorized conversion from `paused` to `completed`)
`PATCH /campaigns/campaign-legit`
```json
{
  "status": "completed"
}
```

### P12: PII Leak - Unauthorized Client Blanket Get
`GET /campaigns` (attempting to list all passwords)

---

## 3. Test Suite Implementation (firestore.rules)
Security constraints are deployed to guarantee zero-bypass integrity.
