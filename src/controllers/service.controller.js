import Service from "../models/service.model.js";

export const createService = async (req, res) => {
    try {
        const { name, slug, serviceCategory, serviceImage, sideImage, shortDescription, longDescription, requiredDocs, estimateDays, faq, isPopular, isActive } = req.body;
        
        if (!name || !slug || !serviceCategory || !sideImage || !shortDescription || !longDescription) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const existingService = await Service.findOne({ slug });
        if (existingService) {
            return res.status(400).json({ message: "Service with this slug already exists" });
        }

        if (faq && !Array.isArray(faq)) {
            return res.status(400).json({ message: "FAQ must be an array of question-answer pairs" });
        }

        console.log(req.user);

        const service = await Service.create({
            name,
            slug,
            serviceCategory,
            serviceImage,
            sideImage,
            shortDescription,
            longDescription,
            requiredDocs,
            estimateDays,
            faq,
            isPopular,
            isActive,
            createdBy: req.user._id
        });

        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find().populate("createdBy", "fullName email");

        if (services.length === 0) {
            return res.status(404).json({ message: "No services found" });
        }
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getServiceBySlug = async (req, res) => {
    try {
        const slug = req.params.slug;
        const service = await Service.findOne({ slug }).populate("createdBy", "fullName email");
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getServicesByCategory = async (req, res) => {
    try {
        const category = req.params.category;
        const services = await Service.find({ serviceCategory: category }).populate("createdBy", "fullName email");

        if (services.length === 0) {
            return res.status(404).json({ message: "No services found in this category" });
        }
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateService = async (req, res) => {
    try {
        const slug = req.params.slug;
        const { name, serviceCategory, serviceImage, sideImage, shortDescription, longDescription, requiredDocs, estimateDays, faq, isPopular, isActive } = req.body;
        const service = await Service.findOne({ slug });
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        if (faq && !Array.isArray(faq)) {
            return res.status(400).json({ message: "FAQ must be an array of question-answer pairs" });
        }
        service.name = name || service.name;
        service.serviceCategory = serviceCategory || service.serviceCategory;
        service.serviceImage = serviceImage || service.serviceImage;
        service.sideImage = sideImage || service.sideImage;
        service.shortDescription = shortDescription || service.shortDescription;
        service.longDescription = longDescription || service.longDescription;
        service.requiredDocs = requiredDocs || service.requiredDocs;
        service.estimateDays = estimateDays || service.estimateDays;
        service.faq = faq || service.faq;
        service.isPopular = isPopular || service.isPopular;
        service.isActive = isActive || service.isActive;
        await service.save();
        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteService = async (req, res) => {
    try {
        const slug = req.params.slug;
        const service = await Service.findOne({ slug });
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        await service.deleteOne({ slug });
        res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};