# ServiceHub - Online Service Marketplace

A modern, full-stack service marketplace platform built with the MERN stack (MongoDB, Express, React, Node.js). Connect service seekers with professional service providers in a seamless, user-friendly environment.

![ServiceHub Banner](https://via.placeholder.com/1200x300/3b82f6/ffffff?text=ServiceHub+-+Your+Service+Marketplace)

## 🌟 Features

### For Customers
- 🔍 **Browse & Search** - Find services by category, location, price, and ratings
- 📅 **Easy Booking** - Schedule services with preferred date and time
- 💬 **Real-time Chat** - Communicate directly with service providers
- ⭐ **Reviews & Ratings** - Leave feedback after service completion
- ❤️ **Save Services** - Bookmark favorite providers for later
- 📱 **Responsive Design** - Works perfectly on all devices

### For Service Providers
- 📝 **Post Services** - Create detailed service listings with images
- 📊 **Dashboard** - Track bookings, revenue, and performance
- ✅ **Manage Bookings** - Accept, reject, or complete service requests
- 💼 **Profile Management** - Build professional profile with portfolio
- 🎯 **Featured Listings** - Boost visibility with featured services

### For Admins
- 👥 **User Management** - Monitor and manage all users
- 🗂️ **Category Management** - Control service categories
- 🚫 **Moderation** - Remove inappropriate content or ban users
- 📈 **Analytics** - Track platform performance and growth

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hot Toast** - Beautiful notifications
- **React Icons** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Socket.io** - Real-time messaging
- **Bcrypt** - Password hashing
- **Cloudinary** - Image hosting
- **Multer** - File uploads

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "service hubs"
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Setup Backend

```bash
cd backend
npm install

# Copy environment file
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/servicehub
# OR use MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/servicehub

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary Configuration (Sign up at https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### 4. Setup Frontend

```bash
cd ../frontend
npm install

# Copy environment file
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🎮 Running the Application

### Option 1: Run Everything at Once (Recommended)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:5173`

### Option 2: Run Separately

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 📱 Application Structure

```
service hubs/
├── backend/
│   ├── config/
│   │   └── cloudinary.js          # Cloudinary configuration
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── bookingController.js   # Booking management
│   │   ├── messageController.js   # Chat functionality
│   │   ├── reviewController.js    # Reviews and ratings
│   │   ├── serviceController.js   # Service listings
│   │   └── userController.js      # User management
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   ├── upload.js              # File upload handling
│   │   └── validator.js           # Input validation
│   ├── models/
│   │   ├── User.js                # User schema
│   │   ├── Service.js             # Service schema
│   │   ├── Booking.js             # Booking schema
│   │   ├── Review.js              # Review schema
│   │   └── Message.js             # Message schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── serviceRoutes.js
│   │   └── userRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ServiceCard.jsx
│   │   │   └── Loader.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── ServiceDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PostService.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── SavedServices.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── ProviderProfile.jsx
│   │   ├── store/
│   │   │   └── authStore.js       # Authentication state
│   │   ├── utils/
│   │   │   └── api.js             # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/upload-profile-pic` - Upload profile picture

### Services
- `GET /api/services` - Get all services (with filters)
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/featured` - Get featured services
- `POST /api/services` - Create service (Provider only)
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/service/:serviceId` - Get service reviews
- `GET /api/reviews/provider/:providerId` - Get provider reviews

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/providers` - Get all providers
- `POST /api/users/save-service/:serviceId` - Save/unsave service

## 🎨 Key Features Implementation

### 1. Search & Filtering
Services can be filtered by:
- Text search (title and description)
- Category
- Location (city, state)
- Price range
- Rating
- Sorting options (newest, price, rating, popular)

### 2. Authentication & Authorization
- JWT-based authentication
- Role-based access control (Customer, Provider, Admin)
- Protected routes on both frontend and backend
- Persistent login with localStorage

### 3. Image Upload
- Cloudinary integration for image hosting
- Multiple image uploads per service
- Image optimization and transformation
- Profile picture upload

### 4. Real-time Messaging
- Socket.io for real-time chat
- Online/offline user status
- Typing indicators
- Message read receipts

### 5. Booking System
- Date and time scheduling
- Status management (pending, accepted, rejected, completed)
- Provider can accept/reject bookings
- Cancellation with reason

### 6. Review System
- Star ratings (1-5)
- Written comments
- Only after service completion
- Provider can respond to reviews
- Automatic rating calculation

## 🚧 Roadmap / Future Enhancements

- [ ] Payment integration (Paystack/Stripe)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced search with location-based filtering
- [ ] Service provider verification system
- [ ] Multi-language support
- [ ] Mobile apps (React Native)
- [ ] Video call integration
- [ ] Subscription plans for providers
- [ ] Analytics dashboard
- [ ] Promotional codes/discounts
- [ ] Calendar integration

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Make sure MongoDB is running
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Change PORT in backend/.env to another port (e.g., 5001)
# Change proxy in frontend/vite.config.js accordingly
```

### Cloudinary Upload Errors
- Verify your Cloudinary credentials in `.env`
- Ensure you have upload permissions enabled
- Check file size limits (default is 5MB)

## 📝 Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 5000) |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret key for JWT | Yes |
| JWT_EXPIRE | JWT expiration time | No (default: 7d) |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | Yes |
| CLOUDINARY_API_KEY | Cloudinary API key | Yes |
| CLOUDINARY_API_SECRET | Cloudinary API secret | Yes |
| CLIENT_URL | Frontend URL | No (default: localhost:5173) |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | Yes |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Your Name - [Your Website](https://yourwebsite.com)

## 🙏 Acknowledgments

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.io Documentation](https://socket.io/docs/)

## 📞 Support

For support, email support@servicehub.com or join our Slack channel.

---

**Happy Coding! 🚀**
