const Contact = require('../models/contact');

exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Create new contact submission
        const contact = new Contact({
            name,
            email,
            message
        });

        // Save to database
        await contact.save();

        res.status(201).json({
            success: true,
            message: 'Thank you for your message. We will get back to you soon!'
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({
            success: false,
            message: 'There was an error submitting your message. Please try again.'
        });
    }
}; 