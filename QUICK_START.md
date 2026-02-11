# ServiceHub - Quick Start Guide

## 🚀 Installation (5 Minutes)

### 1. Install Dependencies

Open PowerShell in the project folder and run:

```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Configure Environment

**Backend Configuration:**
```powershell
cd backend
cp .env.example .env
```

Edit `backend\.env` and update:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Any random secure string
- `CLOUDINARY_*` - Your Cloudinary credentials (get free at cloudinary.com)

**Frontend Configuration:**
```powershell
cd ../frontend
cp .env.example .env
```

The default values should work fine.

### 3. Start the Application

From the root folder:

```powershell
npm run dev
```

Or run separately:

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health:** http://localhost:5000/api/health

## 📝 Quick Testing

1. **Register an Account**
   - Go to http://localhost:5173/register
   - Choose "Provider" role to create services
   - Choose "Customer" role to book services

2. **Post a Service** (Provider)
   - Login → Dashboard → Post Service
   - Fill in details and upload images
   - Service will appear in Browse Services

3. **Book a Service** (Customer)
   - Browse services
   - Click on a service → Book Now
   - Fill booking details

## 🔧 Common Commands

```powershell
# Install all dependencies
npm run install-all

# Run everything
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client
```

## 📁 Project Structure Overview

```
service hubs/
├── backend/          # Node.js + Express API
│   ├── models/      # MongoDB schemas
│   ├── routes/      # API routes
│   ├── controllers/ # Business logic
│   └── server.js    # Entry point
│
└── frontend/        # React + Vite app
    ├── src/
    │   ├── pages/   # React pages
    │   ├── components/ # Reusable components
    │   └── utils/   # API client
    └── index.html
```

## 🎯 Default User Roles

- **Customer** - Can browse and book services
- **Provider** - Can post services and manage bookings
- **Admin** - Full access (implementation in progress)

## 💡 Tips

- Use **Chrome DevTools** to inspect API calls
- Check **MongoDB Compass** to view database
- Use **Postman** to test API endpoints directly

## 🐛 Troubleshooting

**MongoDB not connecting?**
- Ensure MongoDB is running
- Check connection string in `.env`

**Port already in use?**
- Change PORT in `backend/.env`

**Images not uploading?**
- Verify Cloudinary credentials
- Check file size (max 5MB)

## 📚 Next Steps

1. Read the full README.md for detailed documentation
2. Explore the API endpoints
3. Customize the design in Tailwind CSS
4. Add your own features!

---

**Need help?** Check the full README.md or create an issue on GitHub.
