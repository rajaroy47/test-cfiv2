import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    avatar: {
        type: String,
    },
    userDetails: {
        address: {
            streetAddress: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            postalCode: { 
                type: String, 
                trim: true,
                match: [/^\d{6}$/, 'Please fill a valid 6-digit Pincode'] 
            },
            country: { type: String, default: 'India', trim: true }
        },
        identity: {
            panCard: {
                type: String,
                uppercase: true,
                trim: true,
                match: [/[A-Z]{5}[0-9]{4}[A-Z]{1}/, 'Please fill a valid PAN card number'],
            },
            aadhaarCard: {
                type: String,
                trim: true,
                match: [/^\d{12}$/, 'Please fill a valid 12-digit Aadhaar number'],
            },
            phone: {
                type: String,
                trim: true,
                match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number'],
            }
        }
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
    },
    verificationTokenExpiry: {
        type: Date,
    },
    refreshToken: {
        type: String,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

// Hash the password before saving the user
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;