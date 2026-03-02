# MongoDB Setup Guide - CivicLens

This guide explains how to set up both **Local MongoDB** and **MongoDB Atlas** for team collaboration.

---

## Option 1: Local MongoDB (Individual Development)

### Setup
1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Follow installation steps for your OS (Windows/Mac/Linux)

2. **Start MongoDB Service**
   - **Windows**: MongoDB runs as a Windows Service by default (check Services app)
   - **Mac**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

3. **Verify Connection**
   ```bash
   # In the backend folder, run:
   npm run test
   ```
   If it shows "✅ MongoDB connection successful", you're all set!

### Using Local MongoDB
- Ensure `MONGO_URI=mongodb://localhost:27017/civiclens` is set in your `.env` file
- MongoDB data is stored only on your machine
- **Note**: Each teammate needs their own local MongoDB instance

---

## Option 2: MongoDB Atlas (Team Collaboration) - RECOMMENDED

MongoDB Atlas is a managed MongoDB cloud service. This allows all team members to connect to the same database.

### Step-by-Step Setup

#### 1. Create MongoDB Atlas Account
- Go to: https://www.mongodb.com/cloud/atlas
- Sign up or log in
- Create an organization if needed

#### 2. Create a Cluster
- Click "Create" → "Build a Database"
- Choose **FREE** tier (M0 Sandbox)
- Select your region (closest to your location)
- Name your cluster (e.g., "civiclens-cluster")
- Click "Create Deployment"

#### 3. Create a Database User
- In the left sidebar, go to "Database Access"
- Click "Add New Database User"
- Enter username and password (save these securely!)
- Set permissions to "Atlas Admin" for development (change in production)
- Click "Add User"

#### 4. Configure Network Access
- In the left sidebar, go to "Network Access"
- Click "Add IP Address"
- Choose "Allow Access from Anywhere" (for development) or add specific IPs
- Click "Confirm"

#### 5. Get Connection String
- Click "Databases" in the left sidebar
- Click "Connect" on your cluster
- Choose "Drivers" → "Node.js"
- Copy the connection string
- It will look like: `mongodb+srv://username:password@cluster0.mongodb.net/civiclens?retryWrites=true&w=majority`

#### 6. Update .env File
```env
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/civiclens?retryWrites=true&w=majority
```

Replace:
- `your_username` - Your database user username
- `your_password` - Your database user password
- `your_cluster` - Your cluster name (e.g., cluster0)

#### 7. Share with Team
- Send the connection details via secure channel (NOT in git!)
- Each teammate updates their `.env` file with the same MONGO_URI
- All members connect to the same cloud database

### Verify Connection
```bash
npm run test
```
Should show: "✅ MongoDB connection successful"

---

## Switching Between Local and Atlas

### To Use Local MongoDB
In `.env`:
```env
MONGO_URI=mongodb://localhost:27017/civiclens
```

### To Use MongoDB Atlas
In `.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/civiclens?retryWrites=true&w=majority
```

---

## MongoDB Compass (Visual Database Manager)

### For Local MongoDB
- Download from: https://www.mongodb.com/products/compass
- Connect to: `mongodb://localhost:27017`
- You'll see the `civiclens` database and collections automatically

### For MongoDB Atlas
- In MongoDB Compass, click "New Connection"
- Paste your Atlas connection string
- You'll see the same `civiclens` database with team data

---

## Troubleshooting

### ❌ "MongoDB Connection Failed"
**Local MongoDB Issue:**
- Check if MongoDB service is running
- On Windows: Open Services app and look for "MongoDB Server"
- On Mac: Run `brew services list`
- Restart the service if needed

**Atlas Connection Issue:**
- Verify username and password are correct
- Check firewall/IP whitelist in Atlas → Network Access
- Ensure connection string has correct cluster name

### ❌ "Too Many Connections"
- This is normal in development
- MongoDB automatically manages connections through connection pooling
- Check `server.js` line 154-156 for pool settings

---

## Data Sharing Between Team Members

- **Local MongoDB**: Data is isolated to your machine (you need to export/import to share)
- **MongoDB Atlas**: All team members see the same data automatically
- Use MongoDB Compass to inspect shared data in Atlas

---

## Best Practices

| Aspect | Local DB | Atlas |
|--------|----------|-------|
| Development | ✅ Good | ✅ Better |
| Team Collaboration | ❌ Difficult | ✅ Easy |
| Setup Time | ✅ Fast | ⏱️ Moderate |
| Cost | ✅ Free | ✅ Free (M0) |
| Production | ❌ Not suitable | ✅ Yes (with upgrades) |

---

## Additional Resources

- MongoDB Docs: https://docs.mongodb.com/
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Mongoose Docs: https://mongoosejs.com/

