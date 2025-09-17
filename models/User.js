const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const validator = require("validator")

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
    maxlength: [50, "First name cannot exceed 50 characters"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
    maxlength: [50, "Last name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`
})

userSchema.set("toJSON", { virtuals: true })
userSchema.set("toObject", { virtuals: true })

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  const saltRounds = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  this.password = await bcrypt.hash(this.password, saltRounds)

  // Update passwordChangedAt if password was modified (but not on new user creation)
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000 // Subtract 1 second to ensure token is created after password change
  }

  next()
})

userSchema.methods.correctPassword = async (candidatePassword, userPassword) =>
  await bcrypt.compare(candidatePassword, userPassword)

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Number.parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimestamp
  }
  return false
}

module.exports = mongoose.model("User", userSchema)
