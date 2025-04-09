

const loginController = async (req, res) => {
	try {
		const conversation = await getConversationById(req, res);
		res.status(200).json(conversation);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
    loginController,
}