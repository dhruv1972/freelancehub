Database Schema (Spreadsheet-style)

Users
| Field | Type | Constraints | Notes |
|------|------|-------------|-------|
| _id | ObjectId | PK | |
| email | String | unique, required | |
| password | String | required, hashed | |
| firstName | String | required | |
| lastName | String | required | |
| userType | String | required | freelancer/client/admin |
| isVerified | Boolean | default false | |
| isActive | Boolean | default true | |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

Profiles
| Field | Type | Constraints | Notes |
|------|------|-------------|-------|
| _id | ObjectId | PK | |
| userId | ObjectId | FK->Users | |
| bio | String |  | |
| skills | [String] |  | |
| experience | String |  | |
| portfolio | [String] |  | file urls |
| rating | Number | default 0 | 0-5 |
| location | String |  | |

Projects
| Field | Type | Constraints | Notes |
|------|------|-------------|-------|
| _id | ObjectId | PK | |
| clientId | ObjectId | FK->Users | |
| title | String | required | |
| description | String | required | |
| category | String | required | |
| budget | Number | required | |
| timeline | String | required | |
| status | String | default 'open' | open/in-progress/completed |
| requirements | [String] |  | |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

Proposals
| Field | Type | Constraints | Notes |
|------|------|-------------|-------|
| _id | ObjectId | PK | |
| projectId | ObjectId | FK->Projects | |
| freelancerId | ObjectId | FK->Users | |
| coverLetter | String | required | |
| proposedBudget | Number | required | |
| timeline | String | required | |
| status | String | default 'pending' | pending/accepted/rejected |
| createdAt | Date | auto | |

Messages
| Field | Type | Constraints | Notes |
|------|------|-------------|-------|
| _id | ObjectId | PK | |
| senderId | ObjectId | FK->Users | |
| receiverId | ObjectId | FK->Users | |
| projectId | ObjectId | FK->Projects | |
| content | String | required | |
| attachments | [String] |  | |
| read | Boolean | default false | |
| createdAt | Date | auto | |

Payments
| Field | Type | Constraints | Notes |
|------|------|-------------|-------|
| _id | ObjectId | PK | |
| projectId | ObjectId | FK->Projects | |
| freelancerId | ObjectId | FK->Users | |
| clientId | ObjectId | FK->Users | |
| amount | Number | required | |
| currency | String | default 'USD' | |
| status | String | default 'pending' | pending/completed/failed |
| stripePaymentId | String |  | |
| createdAt | Date | auto | |
| completedAt | Date |  | |

Reviews
| Field | Type | Constraints | Notes |
|------|------|-------------|-------|
| _id | ObjectId | PK | |
| projectId | ObjectId | FK->Projects | |
| reviewerId | ObjectId | FK->Users | |
| revieweeId | ObjectId | FK->Users | |
| rating | Number | required | 1-5 |
| comment | String |  | |
| createdAt | Date | auto | |


