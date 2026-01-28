# Command Center - 24/7 Customer Support Application

A comprehensive 24/7 customer support command center application built with React, TypeScript, Node.js, Express, MongoDB, and Socket.io.

## Features

- **Multi-role Authentication**: Support for Customer, Agent, and Admin roles
- **Ticket Management**: Create, assign, track, and resolve support tickets
- **Real-time Communication**: Live chat, voice, and video support sessions
- **AI-Powered Insights**: Confidence scoring and SLA breach detection
- **Analytics Dashboard**: Comprehensive metrics and performance tracking
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- Tailwind CSS for styling
- Socket.io Client for real-time updates
- Axios for API calls

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or remote instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd command-center
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:

Create a `.env` file in the `backend` directory:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/command-center
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### Running the Application

1. Start MongoDB (if running locally):
```bash
mongod
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:4000`

3. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### Creating Accounts

1. Navigate to the login page
2. Click "Register" to create a new account
3. Choose your role (Customer, Agent, or Admin)
4. Fill in your details and register

### Customer Features

- Create support tickets
- Start chat, voice, or video sessions
- View ticket history
- Real-time messaging with agents

### Agent Features

- View and filter tickets
- Assign tickets to yourself
- Update ticket status
- Respond to customer messages
- Track performance metrics

### Admin Features

- View comprehensive analytics dashboard
- Monitor ticket statistics
- Track agent performance
- View SLA breach reports
- Monitor chat session activity

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - Get all tickets (with filters)
- `GET /api/tickets/:id` - Get single ticket with messages
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/assign` - Assign ticket to agent

### Messages
- `GET /api/messages/ticket/:ticketId` - Get messages for a ticket
- `POST /api/messages` - Send a message
- `PUT /api/messages/:ticketId/read` - Mark messages as read

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data (Admin only)
- `GET /api/analytics/agent/:agentId` - Get agent performance

### Chat
- `POST /api/chat/session` - Create chat session
- `GET /api/chat/sessions` - Get active sessions
- `POST /api/chat/session/:id/join` - Join session (Agent)
- `POST /api/chat/session/:id/end` - End session

## Socket.io Events

### Client to Server
- `join:ticket` - Join a ticket room
- `leave:ticket` - Leave a ticket room
- `message:new` - Send new message
- `ticket:update` - Update ticket status
- `chat:join` - Join chat session
- `chat:leave` - Leave chat session
- `chat:message` - Send chat message

### Server to Client
- `message:received` - New message received
- `ticket:updated` - Ticket updated
- `tickets:refresh` - Refresh ticket list
- `chat:message` - Chat message received

## Project Structure

```
command-center/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   └── server.ts        # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with tsx watch mode
```

### Frontend Development
```bash
cd frontend
npm run dev  # Runs Vite dev server
```

### Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
