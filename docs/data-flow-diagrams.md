Data Flow Diagrams (with Error Handling)

User Registration
```
User -> Registration Form -> Validate
  [Invalid] -> Show errors -> Fix -> Validate
  [Valid] -> Check email exists
    [Exists] -> Show "email in use"
    [Free] -> Create user -> Send verification email
      [Email fail] -> Log + retry queue
      [Email sent] -> Done
```

Project Creation
```
Client -> Project Form -> Validate
  [Invalid] -> Show errors
  [Valid] -> Save project -> Notify freelancers
    [DB fail] -> Show error + retry
    [Notify fail] -> Log + retry queue
```

Payment Processing (Stripe)
```
Freelancer -> Invoice -> Client pays -> Stripe
  [Fail] -> Show error + retry
  [Success] -> Update DB
    [DB fail] -> Rollback/flag manual review
  -> Send receipt email
    [Email fail] -> Log + continue
```

Messaging
```
User -> Compose -> Validate -> Save message
  [DB fail] -> Show error + retry
  -> Send realtime via Socket
    [Conn lost] -> Queue to retry
```


