import Article from "../models/article.model.js";
import Like from "../models/like.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";

export const createArticle = async (req, res) => {
  try {
    const { title, slug, content, category } = req.body;

    if (!title || !slug || !content || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Article image is required",
      });
    }

    const existingArticle = await Article.findOne({ slug });

    if (existingArticle) {
      return res.status(409).json({
        success: false,
        message: "Article with this slug already exists",
      });
    }

    const uploadedImage = await uploadToCloudinary(
      req.file.buffer,
      "articles"
    );

    const article = await Article.create({
      title,
      slug,
      content,
      category,
      image: uploadedImage.secure_url,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Article created successfully",
      article,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllArticles = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          content: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      query.category = category;
    }

    const totalArticles = await Article.countDocuments(query);

    const articles = await Article.find(query)
      .populate("createdBy", "fullName email")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      articles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalArticles / limit),
        totalArticles,
        limit,
        hasNextPage: page < Math.ceil(totalArticles / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching articles",
      error: error.message,
    });
  }
};

export const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({
      slug,
    }).populate("createdBy", "fullName email");

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      "createdBy",
      "fullName email",
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateArticle = async (req, res) => {
  try {
    // FLOW STEP 1 & 2: Extract Article ID and fetch existing article from database
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const { title, slug, content, category } = req.body;

    // Handle slug conflict checks
    if (slug && slug !== article.slug) {
      const existing = await Article.findOne({ slug });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Slug already exists",
        });
      }
    }

    let imageUrl = article.image;

    // ONLY execute Cloudinary swap if a new image file is actually uploaded
    if (req.file) {
      
      // FLOW STEP 3: Extract the Old Image's "Public ID" from the stored URL string
      if (article.image) {
        // Splits URL by '/' -> gets last element ('filename.jpg') -> splits extension -> gets raw ID
        const urlParts = article.image.split('/');
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicIdWithoutExtension = filenameWithExtension.split('.')[0];
        
        // Include folder name ('articles') prefix to match Cloudinary's pathing structure
        const oldPublicId = `articles/${publicIdWithoutExtension}`;

        // FLOW STEP 4: Delete Old Image from Cloudinary using Public ID
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (destroyError) {
          console.error("Failed to delete old image from Cloudinary:", destroyError.message);
          // Optional: Don't block the update if deletion fails, or handle error accordingly
        }
      }

      // FLOW STEP 5: Upload New Image to Cloudinary
      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "articles"
      );

      imageUrl = uploadedImage.secure_url;
    }

    // FLOW STEP 6: Update Database Record with New Cloudinary URL (or keep old one if no new file)
    article.title = title || article.title;
    article.slug = slug || article.slug;
    article.content = content || article.content;
    article.category = category || article.category;
    article.image = imageUrl;

    await article.save();

    // FLOW STEP 7: Send Success Response
    return res.status(200).json({
      success: true,
      message: "Article updated successfully",
      article,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    // Safely extract the public_id from the URL string
    if (article.image) {
      const urlParts = article.image.split('/');
      const filename = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `articles/${filename}`;
      
      await deleteFromCloudinary(publicId);
    }

    await Article.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRelatedArticles = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const related = await Article.find({
      category: article.category,
      _id: {
        $ne: article._id,
      },
    })
      .limit(4)
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      related,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const articleLikeDislike = async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.user._id;

        const article = await Article.findById(articleId);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        const existingLike = await Like.findOne({
            articleId,
            userId,
        });

        if (existingLike) {
            await Like.deleteOne({
                _id: existingLike._id,
            });

            return res.status(200).json({
                success: true,
                liked: false,
                message: "Article unliked successfully",
            });
        }

        await Like.create({
            articleId,
            userId,
        });

        return res.status(200).json({
            success: true,
            liked: true,
            message: "Article liked successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const getArticleLikes = async (req, res) => {
    try {
        const articleId = req.params.id;

        const totalLikes = await Like.countDocuments({
            articleId,
        });

        let isLiked = false;

        if (req.user?._id) {
            isLiked = !!(await Like.findOne({
                articleId,
                userId: req.user._id,
            }));
        }

        return res.status(200).json({
            success: true,
            totalLikes,
            isLiked,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};