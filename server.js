const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './.env' });

// Handle Uncaught exceptions
process.on('uncaughtException', (ex) => {
  console.log(
    'UNCAUGHT EXCEPTION Shutting down...',
  );
  console.log(ex.name, ex.message);
});
const app = require('./app');

// MongoDB connection
const DB = process.env.DATABASE_REMOTE.replace(
  '<db_password>',
  process.env.DATABASE_PWD,
);
mongoose.connect(DB).then(() => {
  console.log(
    'Connected to database successfully',
  );
});

// Start he server
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(
    `App is listening... on port ${port}.`,
  );
});

// Handle unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log(
    'UNHANDLED RJECTION Shutting down...',
  );
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
