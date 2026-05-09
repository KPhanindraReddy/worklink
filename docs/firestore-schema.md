# WorkLink Firestore Schema

This schema is optimized for role-based access, real-time chat, bookings, moderation, and profile discovery.

## Collections

### `users/{uid}`

Base user document shared across all roles.

Example fields:

```json
{
  "uid": "abc123",
  "fullName": "Ashok Kumar",
  "phoneNumber": "+919876544321",
  "email": "ashok@example.com",
  "profilePhoto": "https://...",
  "role": "labour",
  "location": "Madhapur, Hyderabad",
  "accountStatus": "active",
  "verified": true,
  "settings": {
    "emailAlerts": true,
    "whatsappAlerts": false
  },
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `labours/{uid}`

Role-specific labour profile used for discovery and dashboard views.

```json
{
  "uid": "abc123",
  "fullName": "Ashok Kumar",
  "category": "Electrician",
  "skills": ["Electrician", "CCTV installation"],
  "languages": ["English", "Telugu", "Hindi"],
  "experienceYears": 8,
  "dailyWage": 1800,
  "availability": "Available",
  "currentLocation": "Madhapur, Hyderabad",
  "about": "Residential and commercial electrical specialist",
  "previousWorkHistory": ["Office rewiring", "CCTV setup"],
  "rating": 4.9,
  "reviewsCount": 126,
  "completedJobs": 312,
  "verified": true
}
```

### `clients/{uid}`

Client-specific profile and shortlist state.

```json
{
  "uid": "client123",
  "fullName": "Ritika Sharma",
  "location": "Gachibowli, Hyderabad",
  "savedLabours": ["labourUid1", "labourUid2"]
}
```

### `bookings/{bookingId}`

Booking and appointment requests between client and labour.

```json
{
  "clientId": "client123",
  "clientName": "Ritika Sharma",
  "labourId": "labour123",
  "labourName": "Ashok Kumar",
  "serviceType": "Electrical inspection",
  "location": "Madhapur, Hyderabad",
  "notes": "Need panel check",
  "amount": 1800,
  "appointmentAt": "2026-05-10 10:30 AM",
  "status": "pending",
  "startOtp": "582914",
  "otpStatus": "waiting",
  "startedAt": "serverTimestamp",
  "completedAt": "serverTimestamp",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

`status` moves through `pending -> accepted -> in_progress -> completed` for normal work. The labour enters the client-visible `startOtp` after reaching the location; that transition marks the labour profile `Busy` so available-search queries stop returning that worker until completion.

### `conversations/{conversationId}`

Top-level one-to-one conversation metadata.

```json
{
  "participantIds": ["client123", "labour123"],
  "participantName": "Ashok Kumar",
  "participantRole": "Electrician",
  "phoneNumber": "+919876544321",
  "whatsAppLink": "https://wa.me/919876544321",
  "lastMessage": "I can reach by 10:30 AM",
  "lastMessageAt": "serverTimestamp",
  "typing": {
    "client123": false,
    "labour123": true
  }
}
```

### `conversations/{conversationId}/messages/{messageId}`

Chat messages.

```json
{
  "senderId": "client123",
  "senderRole": "client",
  "text": "Can you visit tomorrow?",
  "type": "text",
  "readBy": {
    "client123": true,
    "labour123": false
  },
  "createdAt": "serverTimestamp"
}
```

### `notifications/{notificationId}`

User-specific in-app alerts.

```json
{
  "userId": "labour123",
  "title": "New booking request",
  "body": "A client requested an appointment",
  "type": "booking",
  "bookingId": "booking123",
  "read": false,
  "createdAt": "serverTimestamp"
}
```

### `reviews/{reviewId}`

Review data for completed work.

```json
{
  "clientId": "client123",
  "clientName": "Ritika Sharma",
  "labourId": "labour123",
  "rating": 5,
  "review": "Fast and professional",
  "createdAt": "serverTimestamp"
}
```

### `jobs/{jobId}`

Completed work history records.

```json
{
  "clientId": "client123",
  "clientName": "Ritika Sharma",
  "labourId": "labour123",
  "labourName": "Ashok Kumar",
  "workType": "Electrical repair",
  "date": "2026-05-10",
  "location": "Madhapur, Hyderabad",
  "amountPaid": 1800,
  "rating": 5,
  "review": "Fast and clean work"
}
```

### `reports/{reportId}`

Moderation and abuse reports.

### `admin/*`

Reserved area for future analytics rollups, audit logs, and moderation metadata.

## Recommended indexes

The starter indexes in [firestore.indexes.json](/c:/Users/Phani/Downloads/worklink/firestore.indexes.json) support:

- Labour search by `skills`, `availability`, and `rating`
- Scalable available-labour lookup by `availability` and `category`
- Client and labour booking timelines
- Conversation sorting by latest activity
- Notification lists by user and timestamp
- Review lists by labour and timestamp

## Security model

The current rules assume:

- Public read access for labour discovery
- Owner or admin writes for user and profile data
- Conversation access restricted to participants
- Booking access restricted to client, labour, or admin
- Verification and moderation handled by admin accounts

Review [firestore.rules](/c:/Users/Phani/Downloads/worklink/firestore.rules) before production rollout and tighten any flows that should be private in your business model.
