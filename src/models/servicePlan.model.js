import mongoose from "mongoose";

const ServicePlanSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },

    plans: {
        basic: {
                name: {
                    type: String,
                    default: "Basic"
                },
                price: {
                    type: Number,
                    min: 1,
                    required: true
                },
                discount: {
                    type: Number,
                    default: 0
                },
                finalPrice: {
                    type: Number
                },
                features: [String],
                isRecommended: {
                    type: Boolean,
                    default: false
                },
                validTill: {
                    type: Date,
                    default: null
                },
                isAllIncluded: {
                    type: Boolean,
                    default: false
                }
            },

            standard: {
                name: {
                    type: String,
                    default: "Standard"
                },
                price: {
                    type: Number,
                    min: 1,
                    required: true
                },  
                discount: {
                    type: Number,
                    default: 0
                },
                finalPrice: {
                    type: Number
                },
                features: [String],
                isRecommended: {
                    type: Boolean,
                    default: false
                },
                validTill: {
                    type: Date,
                    default: null
                },
                isAllIncluded: {
                    type: Boolean,
                    default: false
                }
            },

            premium: {
                name: {
                    type: String,
                    default: "Premium"
                },
                price: {
                    type: Number,
                    min: 1,
                    required: true
                },
                discount: {
                    type: Number,
                    default: 0
                },
                finalPrice: {
                    type: Number
                },
                features: [String],
                isRecommended: {
                    type: Boolean,
                    default: false
                },
                validTill: {
                    type: Date,
                    default: null
                },
                isAllIncluded: {
                    type: Boolean,
                    default: false
                }
            }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, { timestamps: true });

ServicePlanSchema.pre('save', async function () {
  if (this.plans) {
    const tiers = ['basic', 'standard', 'premium'];

    tiers.forEach((tier) => {
      // 🛡️ FIX: Instead of checking if price is in the update layout payload, 
      // check if a price exists anywhere on this instance (database or new changes).
      if (this.plans[tier] && (this.plans[tier].price !== undefined || this.plans[tier].price !== null)) {
        const price = Number(this.plans[tier].price || 0);
        const discount = Number(this.plans[tier].discount || 0);

        // Dynamically compute finalPrice every time a save event triggers
        this.plans[tier].finalPrice = Math.max(0, price - discount);
      }
    });
  }
});

const ServicePlan = mongoose.model("ServicePlan", ServicePlanSchema);

export default ServicePlan;


